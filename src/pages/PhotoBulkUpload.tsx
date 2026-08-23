// src/pages/PhotoBulkUpload.tsx
//
// Bulk upload for the two kinds of part photo. They are different pictures with
// different destinations and different naming rules:
//
//   CATALYST (engineering)  -> POST /api/partimages/{partNumber}/upload
//        Shown inside Catalyst on the product page. Many per part.
//        Strict: the filename stem must match a Catalyst part number exactly.
//
//   CATALOG (customer site) -> POST /api/customer-images/upload
//        Served by the LVM website as /images/Parts/{PartNumber}.jpg, so the
//        API always rewrites the name to {PartNumber}.jpg. One per part.
//        Lenient: the catalog's authoritative product list lives in the MeFinal
//        database, which this API cannot read, so an unknown part number is a
//        warning rather than a failure.
//
// Flow: drop -> preflight table -> confirm -> upload -> results.
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type Kind = "catalyst" | "catalog";

// The site renders /images/Parts/{part}.jpg, so only real JPEGs are visible
// there. Engineering photos are served through the API, which also allows png
// and webp.
const CATALOG_EXT = [".jpg", ".jpeg"];
const CATALYST_EXT = [".jpg", ".jpeg", ".png", ".webp"];

type Status = "ok" | "warn" | "bad";

interface Row {
  file: File;
  stem: string;
  ext: string;
  status: Status;
  reason: string;
  partNumber?: string;
  existing: boolean;
}

interface Dest {
  configured: boolean;
  path: string | null;
  exists: boolean;
  writable: boolean;
  problem?: string | null;
}

interface Result {
  name: string;
  ok: boolean;
  reason: string;
}

const KINDS: Record<Kind, { label: string; blurb: string; accent: string; exts: string[] }> = {
  catalyst: {
    label: "CATALYST",
    blurb: "Engineering photos shown on the product page inside Catalyst.",
    accent: "#0f0",
    exts: CATALYST_EXT,
  },
  catalog: {
    label: "CATALOG",
    blurb: "Customer-facing photos published to the Lee Valley website.",
    accent: "#0af",
    exts: CATALOG_EXT,
  },
};

export default function PhotoBulkUpload() {
  const navigate = useNavigate();

  const [parts, setParts] = useState<Map<string, string> | null>(null); // lowercase -> real
  const [loadError, setLoadError] = useState(false);
  const [dest, setDest] = useState<Dest | null>(null);
  const [kind, setKind] = useState<Kind>("catalyst");
  const [dragging, setDragging] = useState<Kind | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Result[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Part numbers drive the preflight check, so load them once up front.
  useEffect(() => {
    axios
      .get<{ partNumber: string }[]>("/api/products")
      .then((res) => {
        const m = new Map<string, string>();
        (res.data || []).forEach((p) => {
          if (p.partNumber) m.set(p.partNumber.toLowerCase(), p.partNumber);
        });
        setParts(m);
      })
      .catch(() => setLoadError(true));
  }, []);

  // The catalog folder belongs to the MarineEast site, not to Catalyst, so it can
  // be unset or unwritable on this server. Find out before a batch is dropped.
  useEffect(() => {
    axios
      .get<Dest>("/api/customer-images/destination")
      .then((res) => setDest(res.data))
      .catch(() => setDest(null));
  }, []);

  const catalogReady = !dest || (dest.configured && dest.exists && dest.writable);

  const examine = (files: File[], k: Kind): Row[] => {
    const allowed = KINDS[k].exts;
    const seen = new Set<string>();
    return files.map((file) => {
      const dot = file.name.lastIndexOf(".");
      const stem = (dot === -1 ? file.name : file.name.slice(0, dot)).trim();
      const ext = dot === -1 ? "" : file.name.slice(dot).toLowerCase();

      const base: Omit<Row, "status" | "reason"> = {
        file,
        stem,
        ext,
        partNumber: parts?.get(stem.toLowerCase()),
        existing: false,
      };

      if (!allowed.includes(ext)) {
        const why =
          k === "catalog" && (ext === ".png" || ext === ".webp")
            ? `${ext} is not shown by the website — save as .jpg`
            : `Unsupported file type ${ext || "(none)"}`;
        return { ...base, status: "bad", reason: why };
      }
      if (!stem) return { ...base, status: "bad", reason: "Filename has no part number" };

      // A second file for the same part would overwrite the first on the catalog
      // side, where the name is forced to {part}.jpg.
      const dupKey = stem.toLowerCase();
      if (k === "catalog" && seen.has(dupKey)) {
        return { ...base, status: "bad", reason: "Duplicate — another file in this batch targets the same part" };
      }
      seen.add(dupKey);

      if (base.partNumber) {
        return {
          ...base,
          status: "ok",
          reason: k === "catalog" ? "Will publish as " + base.partNumber + ".jpg" : "Matched",
        };
      }
      if (k === "catalog") {
        return {
          ...base,
          status: "warn",
          reason: "Not in Catalyst — may still be a valid website part",
        };
      }
      return { ...base, status: "bad", reason: "No part number matches \"" + stem + "\"" };
    });
  };

  const accept = (files: File[], k: Kind) => {
    if (!files.length) return;
    setKind(k);
    setResults(null);
    setRows(examine(files, k));
  };

  const onDrop = (e: React.DragEvent, k: Kind) => {
    e.preventDefault();
    setDragging(null);
    accept(Array.from(e.dataTransfer.files), k);
  };

  const counts = useMemo(() => {
    const ok = rows.filter((r) => r.status === "ok").length;
    const warn = rows.filter((r) => r.status === "warn").length;
    const bad = rows.filter((r) => r.status === "bad").length;
    return { ok, warn, bad, sendable: ok + warn };
  }, [rows]);

  const upload = async () => {
    const queue = rows.filter((r) => r.status !== "bad");
    if (!queue.length) return;

    setUploading(true);
    setProgress(0);
    const out: Result[] = rows
      .filter((r) => r.status === "bad")
      .map((r) => ({ name: r.file.name, ok: false, reason: r.reason }));

    // Small concurrency window: fast enough for a few hundred files without
    // opening hundreds of sockets at once.
    const LIMIT = 4;
    let cursor = 0;
    let done = 0;

    const worker = async () => {
      while (cursor < queue.length) {
        const row = queue[cursor++];
        const part = row.partNumber || row.stem;
        try {
          const fd = new FormData();
          if (kind === "catalog") {
            fd.append("file", row.file);
            fd.append("partNumber", part);
            await axios.post("/api/customer-images/upload", fd);
          } else {
            fd.append("files", row.file);
            await axios.post(`/api/partimages/${encodeURIComponent(part)}/upload`, fd);
          }
          out.push({ name: row.file.name, ok: true, reason: "" });
        } catch (err: any) {
          const d = err?.response?.data;
          const msg =
            (typeof d === "string" && d) ||
            d?.error ||
            d?.message ||
            err?.message ||
            "Upload failed";
          out.push({ name: row.file.name, ok: false, reason: msg });
        }
        done++;
        setProgress(Math.round((done / queue.length) * 100));
      }
    };

    await Promise.all(Array.from({ length: Math.min(LIMIT, queue.length) }, worker));

    setUploading(false);
    setResults(out);
    setRows([]);
    const good = out.filter((r) => r.ok).length;
    if (good) toast.success(`${good} photo${good === 1 ? "" : "s"} uploaded`);
    if (good < out.length) toast.error(`${out.length - good} failed — see the report`);
  };

  const reset = () => {
    setRows([]);
    setResults(null);
    setProgress(0);
  };

  const statusColor = (s: Status) => (s === "ok" ? "#0f0" : s === "warn" ? "#ff0" : "#f55");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#0f0", margin: 0, fontSize: isMobile ? "1.5rem" : "2rem" }}>
            Bulk Photo Upload
          </h1>
          <p style={{ color: "#888", margin: "6px 0 0", fontSize: "0.9rem" }}>
            Name each file with its part number — <code style={{ color: "#0f0" }}>4080.jpg</code>,{" "}
            <code style={{ color: "#0f0" }}>PLA1211-A.jpg</code>. The name must match the part number exactly.
          </p>
        </div>
        <button onClick={() => navigate(-1)} style={btn("#0f0")}>← Back</button>
      </div>

      {loadError && (
        <div style={banner("#f55")}>
          Couldn't load part numbers, so files can't be checked before uploading. Reload the page to try again.
        </div>
      )}

      {dest && !catalogReady && (
        <div style={banner("#ff0")}>
          <strong>CATALOG uploads are unavailable.</strong>{" "}
          {dest.problem || "The customer-site image folder is not usable."}
          <div style={{ color: "#888", marginTop: 6 }}>
            Set <code style={{ color: "#ddd" }}>CustomerSiteImagesPath</code> in this server's
            appsettings.json to the MarineEast images folder. Engineering photos are unaffected.
          </div>
        </div>
      )}

      {/* ---------- drop zones ---------- */}
      {!rows.length && !results && (
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexDirection: isMobile ? "column" : "row" }}>
          {(Object.keys(KINDS) as Kind[]).map((k) => {
            const cfg = KINDS[k];
            const active = dragging === k;
            return (
              <div
                key={k}
                onDragOver={(e) => { e.preventDefault(); if (k !== "catalog" || catalogReady) setDragging(k); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(null); }}
                onDrop={(e) => { if (k === "catalog" && !catalogReady) { e.preventDefault(); setDragging(null); return; } onDrop(e, k); }}
                onClick={() => { if (k === "catalog" && !catalogReady) return; setKind(k); inputRef.current?.click(); }}
                style={{
                  flex: 1,
                  minHeight: isMobile ? 170 : 260,
                  border: `3px dashed ${active ? cfg.accent : "#444"}`,
                  borderRadius: 16,
                  background: active ? `${cfg.accent}14` : "rgba(255,255,255,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                  cursor: k === "catalog" && !catalogReady ? "not-allowed" : "pointer",
                  opacity: k === "catalog" && !catalogReady ? 0.45 : 1,
                  textAlign: "center",
                  transition: "all .2s ease",
                }}
              >
                <div style={{ color: cfg.accent, fontSize: "1.3rem", fontWeight: "bold", letterSpacing: "0.05em" }}>
                  {cfg.label}
                </div>
                <div style={{ color: "#aaa", fontSize: "0.85rem", margin: "10px 0 14px", maxWidth: 260, lineHeight: 1.5 }}>
                  {cfg.blurb}
                </div>
                <div style={{ color: active ? cfg.accent : "#666", fontSize: "0.9rem" }}>
                  {k === "catalog" && !catalogReady
                    ? "Unavailable — destination not ready"
                    : active
                    ? "Release to check"
                    : "Drop photos or click"}
                </div>
                <div style={{ color: "#555", fontSize: "0.72rem", marginTop: 8 }}>
                  {cfg.exts.join("  ")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          accept(Array.from(e.target.files || []), kind);
          e.target.value = "";
        }}
      />

      {/* ---------- preflight ---------- */}
      {rows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div style={{ color: "#fff", fontSize: "1.05rem" }}>
              <span style={{ color: KINDS[kind].accent, fontWeight: "bold" }}>{KINDS[kind].label}</span>
              {"  "}— {rows.length} file{rows.length === 1 ? "" : "s"} checked
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={pill("#0f0")}>{counts.ok} ready</span>
              {counts.warn > 0 && <span style={pill("#ff0")}>{counts.warn} warning</span>}
              {counts.bad > 0 && <span style={pill("#f55")}>{counts.bad} will be skipped</span>}
            </div>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #333", borderRadius: 10, background: "#1a1a1a" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th style={th}>File</th>
                  <th style={th}>Part</th>
                  <th style={th}>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #2a2a2a" }}>
                    <td style={{ ...td, color: "#ddd", whiteSpace: "nowrap" }}>{r.file.name}</td>
                    <td style={{ ...td, color: r.partNumber ? "#0f0" : "#777", whiteSpace: "nowrap" }}>
                      {r.partNumber || "—"}
                    </td>
                    <td style={{ ...td, color: statusColor(r.status) }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: KINDS[kind].accent, transition: "width .2s" }} />
              </div>
              <div style={{ color: "#888", fontSize: "0.8rem", marginTop: 6 }}>Uploading… {progress}%</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button
              onClick={upload}
              disabled={uploading || counts.sendable === 0}
              style={{
                ...btn(KINDS[kind].accent),
                background: counts.sendable && !uploading ? KINDS[kind].accent : "transparent",
                color: counts.sendable && !uploading ? "#000" : "#666",
                cursor: counts.sendable && !uploading ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              {uploading ? "Uploading…" : `Upload ${counts.sendable} photo${counts.sendable === 1 ? "" : "s"}`}
            </button>
            <button onClick={reset} disabled={uploading} style={btn("#888")}>Cancel</button>
          </div>
        </div>
      )}

      {/* ---------- results ---------- */}
      {results && (
        <div style={{ marginTop: 24 }}>
          {(() => {
            const good = results.filter((r) => r.ok);
            const bad = results.filter((r) => !r.ok);
            return (
              <>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ ...card, borderLeft: "3px solid #0f0" }}>
                    <div style={{ color: "#0f0", fontSize: "2rem", fontWeight: "bold" }}>{good.length}</div>
                    <div style={{ color: "#888", fontSize: "0.8rem" }}>uploaded</div>
                  </div>
                  <div style={{ ...card, borderLeft: `3px solid ${bad.length ? "#f55" : "#333"}` }}>
                    <div style={{ color: bad.length ? "#f55" : "#666", fontSize: "2rem", fontWeight: "bold" }}>{bad.length}</div>
                    <div style={{ color: "#888", fontSize: "0.8rem" }}>failed</div>
                  </div>
                </div>

                {bad.length > 0 && (
                  <>
                    <h2 style={{ color: "#f55", fontSize: "1rem", margin: "0 0 10px" }}>Failed</h2>
                    <div style={{ overflowX: "auto", border: "1px solid #333", borderRadius: 10, background: "#1a1a1a", marginBottom: 18 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead><tr><th style={th}>File</th><th style={th}>Reason</th></tr></thead>
                        <tbody>
                          {bad.map((r, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #2a2a2a" }}>
                              <td style={{ ...td, color: "#ddd", whiteSpace: "nowrap" }}>{r.name}</td>
                              <td style={{ ...td, color: "#f55" }}>{r.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {good.length > 0 && (
                  <details style={{ marginBottom: 18 }}>
                    <summary style={{ color: "#0f0", cursor: "pointer", fontSize: "0.9rem" }}>
                      {good.length} uploaded successfully
                    </summary>
                    <div style={{ color: "#888", fontSize: "0.82rem", marginTop: 10, lineHeight: 1.7 }}>
                      {good.map((r) => r.name).join(",  ")}
                    </div>
                  </details>
                )}

                <button onClick={reset} style={{ ...btn("#0f0"), fontWeight: "bold" }}>Upload more</button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const btn = (c: string): React.CSSProperties => ({
  background: "transparent",
  color: c,
  border: `1px solid ${c}`,
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: "0.9rem",
  cursor: "pointer",
});

const pill = (c: string): React.CSSProperties => ({
  color: c,
  border: `1px solid ${c}`,
  borderRadius: 20,
  padding: "3px 12px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  whiteSpace: "nowrap",
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

const card: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 10,
  padding: "14px 22px",
  minWidth: 110,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  color: "#888",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "#151515",
  position: "sticky",
  top: 0,
};

const td: React.CSSProperties = { padding: "9px 14px", verticalAlign: "top" };
