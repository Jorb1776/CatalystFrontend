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
  const [filter, setFilter] = useState<Filter>("todo");
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
    setBusy(`${part}/${file}`);
    try {
      await axios.post("/api/customer-images/publish-from-partimages", {
        partNumber: part,
        fileName: file,
      });
      setPublished((p) => ({ ...p, [part]: file }));
      toast.success(`${part} published to the catalog`);
    } catch (err: any) {
      const d = err?.response?.data;
      toast.error(d?.error || d?.message || err?.message || "Publish failed");
    } finally {
      setBusy(null);
    }
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
                        src={`/api/customer-images/preview/${encodeURIComponent(p.partNumber)}?t=${Date.now()}`}
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
                            ? { label: "Use for catalog", onClick: () => publish(p.partNumber, p.flatFile!), busy: busy === `${p.partNumber}/${p.flatFile}` }
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
                            ? { label: "Publish to catalog", onClick: () => publish(p.partNumber, f), busy: busy === `${p.partNumber}/${f}` }
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
  action?: { label: string; onClick: () => void; busy: boolean };
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
          <img src={src} alt={caption} onError={() => setBroken(true)}
               style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        )}
      </div>
      <div style={{ color: "#777", fontSize: "0.68rem", wordBreak: "break-all", lineHeight: 1.4 }}>{caption}</div>
      {action && (
        <button onClick={action.onClick} disabled={action.busy}
          style={{ ...btn(accent), padding: "6px 10px", fontSize: "0.76rem", cursor: action.busy ? "wait" : "pointer" }}>
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
