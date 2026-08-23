// src/pages/CatalogPhotoReview.tsx
//
// Sorts out the PartImages tree that earlier uploads left in a mixed state.
//
// "+ Add Photos" on the product page used to write into a {partNumber}/ subfolder
// keeping whatever filename arrived, so catalog shots exported from CAD ended up
// nested under the part with names like
// 3530_2026-Apr-01_..._CustomizedView...jpg, while the flat {part}.jpg stayed the
// engineering photo. The photos in those subfolders are usually the catalog shot
// and belong on the customer site instead.
//
// Publishing to the live customer site is not something to do from a guess, so
// this shows the actual images side by side and publishes only what is clicked.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface PartRow {
  partNumber: string;
  flatFile: string | null;
  folderFiles: string[];
  hasCatalog: boolean;
}

interface Inventory {
  catalogConfigured: boolean;
  flatOnlyCount: number;
  parts: PartRow[];
}

type Filter = "todo" | "all" | "done";

export default function CatalogPhotoReview() {
  const navigate = useNavigate();
  const [inv, setInv] = useState<Inventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<string, string>>({});
  const [previewBust, setPreviewBust] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>("todo");
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<{ ok: string[]; failed: { part: string; reason: string }[]; ambiguous: string[] } | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const load = useCallback(() => {
    setError(null);
    axios
      // Scans the whole image tree and the customer-site folder on another
      // volume, so it needs more than the 10s default.
      .get<Inventory>("/api/partimages/inventory", { timeout: 60000 })
      .then((res) => {
        const d: any = res.data;
        if (!d || typeof d !== "object" || !Array.isArray(d.parts)) {
          setError("This server's API is older than this page. Deploy the API build.");
          return;
        }
        setInv(d as Inventory);
      })
      .catch((err) =>
        setError(err?.response?.data?.error || err?.message || "Could not load the photo inventory.")
      );
  }, []);

  useEffect(load, [load]);

  const publish = async (part: string, file: string) => {
    // One at a time: the customer site can hold the target file open, and
    // overlapping requests made that worse rather than better.
    if (busy || bulk) return;
    setBusy(`${part}/${file}`);
    try {
      // Copies across volumes to the customer site, which is slower than the
      // 10s default allows for a large photo.
      const res = await axios.post(
        "/api/customer-images/publish-from-partimages",
        { partNumber: part, fileName: file },
        { timeout: 120000 }
      );
      setPublished((p) => ({ ...p, [part]: file }));
      setPreviewBust((b) => ({ ...b, [part]: Date.now() }));
      const d: any = res?.data;
      // Surface the server-side timing so a slow publish can be diagnosed
      // without opening devtools.
      toast.success(
        d?.totalMs != null
          ? `${part} published — ${d.sourceKb}KB in ${d.totalMs}ms (copy ${d.copyMs}ms, ${d.attempts} attempt${d.attempts === 1 ? "" : "s"})`
          : `${part} published to the catalog`
      );
    } catch (err: any) {
      const d = err?.response?.data;
      toast.error(d?.error || d?.message || err?.message || "Publish failed");
    } finally {
      setBusy(null);
    }
  };

  // Publish every part currently listed, using its first subfolder photo -- the
  // one the page marks "likely". Parts with more than one subfolder photo are
  // reported afterwards so they can be checked by eye.
  const publishAll = async () => {
    const queue = rows.filter((p) => p.folderFiles.length > 0);
    if (!queue.length) return;

    const overwriting = queue.filter((p) => p.hasCatalog).length;
    const warning = overwriting
      ? `

${overwriting} of these already have a catalog photo and WILL BE REPLACED on the live site.`
      : "";
    if (!window.confirm(
      `Publish ${queue.length} photo${queue.length === 1 ? "" : "s"} to the customer site?` +
      warning +
      `

Each publishes as {part}.jpg and goes live immediately.`
    )) return;

    setReport(null);
    setBulk({ done: 0, total: queue.length });

    const ok: string[] = [];
    const failed: { part: string; reason: string }[] = [];
    const ambiguous = queue.filter((p) => p.folderFiles.length > 1).map((p) => p.partNumber);

    let cursor = 0, done = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const row = queue[cursor++];
        const file = row.folderFiles[0];
        try {
          await axios.post(
            "/api/customer-images/publish-from-partimages",
            { partNumber: row.partNumber, fileName: file },
            { timeout: 120000 }
          );
          ok.push(row.partNumber);
          setPublished((prev) => ({ ...prev, [row.partNumber]: file }));
        } catch (err: any) {
          const d = err?.response?.data;
          const timedOut = err?.code === "ECONNABORTED";
          failed.push({
            part: row.partNumber,
            reason: timedOut
              ? "Timed out copying to the customer site — may still have completed; refresh to check"
              : d?.error || d?.message || err?.message || "Publish failed",
          });
        }
        done++;
        setBulk({ done, total: queue.length });
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));

    setBulk(null);
    setReport({ ok, failed, ambiguous });
    if (ok.length) toast.success(`${ok.length} published to the catalog`);
    if (failed.length) toast.error(`${failed.length} failed — see the report`);
  };

  const rows = useMemo(() => {
    if (!inv) return [];
    const list = inv.parts.filter((p) => p.folderFiles.length > 0);
    if (filter === "all") return list;
    const done = (p: PartRow) => p.hasCatalog || !!published[p.partNumber];
    return filter === "done" ? list.filter(done) : list.filter((p) => !done(p));
  }, [inv, filter, published]);

  const counts = useMemo(() => {
    if (!inv) return { total: 0, todo: 0, done: 0 };
    const list = inv.parts.filter((p) => p.folderFiles.length > 0);
    const done = list.filter((p) => p.hasCatalog || !!published[p.partNumber]).length;
    return { total: list.length, todo: list.length - done, done };
  }, [inv, published]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#0f0", margin: 0, fontSize: isMobile ? "1.5rem" : "2rem" }}>
            Catalog Photo Review
          </h1>
          <p style={{ color: "#888", margin: "6px 0 0", fontSize: "0.9rem", maxWidth: 620, lineHeight: 1.5 }}>
            Parts whose photos ended up in a subfolder. Pick the one that belongs on the
            customer site — it publishes as <code style={{ color: "#0f0" }}>{"{part}"}.jpg</code>.
          </p>
        </div>
        <button onClick={() => navigate(-1)} style={btn("#0f0")}>← Back</button>
      </div>

      {error && <div style={banner("#f55")}>{error}</div>}

      {inv && !inv.catalogConfigured && (
        <div style={banner("#ff0")}>
          <strong>Publishing is unavailable.</strong> The customer-site image folder isn't
          configured or doesn't exist on this server, so nothing can be published yet.
        </div>
      )}

      {inv && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0 22px", alignItems: "center" }}>
            {(["todo", "done", "all"] as Filter[]).map((f) => {
              const label = f === "todo" ? `Needs a catalog photo (${counts.todo})`
                          : f === "done" ? `Already has one (${counts.done})`
                          : `All (${counts.total})`;
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  ...btn(active ? "#0f0" : "#666"),
                  background: active ? "#0f0" : "transparent",
                  color: active ? "#000" : "#888",
                  fontWeight: active ? "bold" : "normal",
                  fontSize: "0.82rem",
                  padding: "7px 15px",
                }}>{label}</button>
              );
            })}
            <span style={{ color: "#555", fontSize: "0.8rem", marginLeft: "auto" }}>
              {inv.flatOnlyCount} parts have only a flat photo and aren't listed
            </span>
          </div>

          {/* bulk publish */}
          {rows.length > 0 && inv.catalogConfigured && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
              padding: "13px 16px", marginBottom: 16,
            }}>
              <button
                onClick={publishAll}
                disabled={!!bulk}
                style={{
                  ...btn("#0f0"),
                  background: bulk ? "transparent" : "#0f0",
                  color: bulk ? "#666" : "#000",
                  fontWeight: "bold",
                  cursor: bulk ? "wait" : "pointer",
                }}
              >
                {bulk ? `Publishing ${bulk.done}/${bulk.total}…` : `Publish all ${rows.length} shown`}
              </button>
              <span style={{ color: "#888", fontSize: "0.8rem", flex: 1, minWidth: 220, lineHeight: 1.5 }}>
                Uses each part's subfolder photo — the one marked <span style={{ color: "#0f0" }}>likely</span>.
                {filter !== "todo" && (
                  <span style={{ color: "#ff0" }}> This view includes parts that already have a catalog photo; those would be replaced.</span>
                )}
              </span>
            </div>
          )}

          {bulk && (
            <div style={{ height: 6, background: "#222", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: `${Math.round((bulk.done / bulk.total) * 100)}%`, height: "100%", background: "#0f0", transition: "width .2s" }} />
            </div>
          )}

          {report && (
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderLeft: `3px solid ${report.failed.length ? "#f55" : "#0f0"}`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: report.failed.length || report.ambiguous.length ? 12 : 0 }}>
                <span style={{ color: "#0f0" }}><b style={{ fontSize: "1.3rem" }}>{report.ok.length}</b> published</span>
                <span style={{ color: report.failed.length ? "#f55" : "#666" }}><b style={{ fontSize: "1.3rem" }}>{report.failed.length}</b> failed</span>
              </div>
              {report.ambiguous.length > 0 && (
                <div style={{ color: "#ff0", fontSize: "0.8rem", marginBottom: 10, lineHeight: 1.5 }}>
                  {report.ambiguous.length} part{report.ambiguous.length === 1 ? " had" : "s had"} more than one subfolder photo, so the first was used — worth checking by eye:{" "}
                  <span style={{ color: "#ddd" }}>{report.ambiguous.join(", ")}</span>
                </div>
              )}
              {report.failed.length > 0 && (
                <div style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
                  {report.failed.map((f) => (
                    <div key={f.part}><span style={{ color: "#f55" }}>{f.part}</span> <span style={{ color: "#888" }}>— {f.reason}</span></div>
                  ))}
                </div>
              )}
              <button onClick={() => { setReport(null); load(); }} style={{ ...btn("#888"), padding: "6px 14px", fontSize: "0.78rem", marginTop: 12 }}>
                Refresh list
              </button>
            </div>
          )}

          {rows.length === 0 && (
            <div style={{ color: "#888", textAlign: "center", padding: "50px 20px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 12 }}>
              {filter === "todo" ? "Nothing left to review." : "Nothing here."}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rows.map((p) => {
              const justDone = published[p.partNumber];
              return (
                <div key={p.partNumber} style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderLeft: `3px solid ${justDone || p.hasCatalog ? "#0f0" : "#555"}`,
                  borderRadius: 12,
                  padding: isMobile ? 14 : 18,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    <span style={{ color: "#0f0", fontWeight: "bold", fontSize: "1.05rem" }}>{p.partNumber}</span>
                    <span style={{ color: justDone || p.hasCatalog ? "#0f0" : "#777", fontSize: "0.78rem" }}>
                      {justDone ? `published: ${justDone}` : p.hasCatalog ? "catalog photo exists" : "no catalog photo"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {/* current catalog image, if any */}
                    {p.hasCatalog && (
                      <Tile
                        label="On the customer site"
                        src={`/api/customer-images/preview/${encodeURIComponent(p.partNumber)}${previewBust[p.partNumber] ? `?t=${previewBust[p.partNumber]}` : ""}`}
                        caption={`${p.partNumber}.jpg`}
                        accent="#0af"
                      />
                    )}

                    {/* flat = engineering photo */}
                    {p.flatFile && (
                      <Tile
                        label="Engineering (flat)"
                        src={`/api/partimages/${encodeURIComponent(p.partNumber)}/${encodeURIComponent(p.flatFile)}`}
                        caption={p.flatFile}
                        accent="#888"
                        action={
                          inv.catalogConfigured
                            ? { label: "Use for catalog", onClick: () => publish(p.partNumber, p.flatFile!), busy: busy === `${p.partNumber}/${p.flatFile}`, blocked: !!busy || !!bulk }
                            : undefined
                        }
                      />
                    )}

                    {/* subfolder = usually the catalog shot */}
                    {p.folderFiles.map((f) => (
                      <Tile
                        key={f}
                        label="In subfolder"
                        src={`/api/partimages/${encodeURIComponent(p.partNumber)}/${encodeURIComponent(f)}`}
                        caption={f}
                        accent="#0f0"
                        suggested
                        action={
                          inv.catalogConfigured
                            ? { label: "Publish to catalog", onClick: () => publish(p.partNumber, f), busy: busy === `${p.partNumber}/${f}`, blocked: !!busy || !!bulk }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!inv && !error && (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading photo inventory…</div>
      )}
    </div>
  );
}

function Tile({ label, src, caption, accent, suggested, action }: {
  label: string;
  src: string;
  caption: string;
  accent: string;
  suggested?: boolean;
  action?: { label: string; onClick: () => void; busy: boolean; blocked?: boolean };
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{ width: 190, display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ color: accent, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 6, alignItems: "center" }}>
        {label}
        {suggested && <span style={{ color: "#0f0", border: "1px solid #0f0", borderRadius: 3, padding: "0 5px", fontSize: "0.62rem" }}>likely</span>}
      </div>
      <div style={{ width: 190, height: 150, background: "#111", border: `1px solid ${accent}44`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {broken ? (
          <span style={{ color: "#555", fontSize: "0.75rem" }}>preview unavailable</span>
        ) : (
          <img src={src} alt={caption} loading="lazy" decoding="async"
               onError={() => setBroken(true)}
               style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        )}
      </div>
      <div style={{ color: "#777", fontSize: "0.68rem", wordBreak: "break-all", lineHeight: 1.4 }}>{caption}</div>
      {action && (
        <button onClick={action.onClick} disabled={action.busy || action.blocked}
          style={{
            ...btn(accent),
            padding: "6px 10px",
            fontSize: "0.76rem",
            opacity: action.blocked && !action.busy ? 0.4 : 1,
            cursor: action.busy ? "wait" : action.blocked ? "not-allowed" : "pointer",
          }}>
          {action.busy ? "Publishing…" : action.label}
        </button>
      )}
    </div>
  );
}

const btn = (c: string): React.CSSProperties => ({
  background: "transparent",
  color: c,
  border: `1px solid ${c}`,
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: "0.88rem",
  cursor: "pointer",
});

const banner = (c: string): React.CSSProperties => ({
  marginTop: 18,
  padding: "12px 16px",
  border: `1px solid ${c}`,
  borderLeft: `3px solid ${c}`,
  borderRadius: 8,
  background: "#1a1a1a",
  color: c,
  fontSize: "0.85rem",
});
