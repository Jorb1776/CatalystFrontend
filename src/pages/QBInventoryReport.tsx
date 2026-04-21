import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";

interface QBItem {
  id: number;
  name: string;
  fullName?: string;
  quantityOnHand: number;
  reorderPoint: number;
  isActive?: boolean;
  matchedProductId?: number | null;
  lastSyncDate?: string;
}

interface Summary {
  total: number;
  matched: number;
  unmatched: number;
}

export default function QBInventoryReport() {
  const [items, setItems] = useState<QBItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [view, setView] = useState<"unmatched" | "all">("unmatched");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<Summary>("/api/qbinventory/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const url = view === "unmatched" ? "/api/qbinventory/unmatched" : "/api/qbinventory";
    axios.get<QBItem[]>(url).then(r => setItems(r.data)).catch(() => {});
  }, [view]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <h2 style={{ color: "#0f0", margin: "0 0 24px", fontSize: "1.8rem" }}>QuickBooks Inventory Report</h2>

      {summary && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Total QB Items</p>
            <p style={styles.cardValue}>{summary.total}</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#0f0" }}>
            <p style={styles.cardLabel}>Matched in Catalyst</p>
            <p style={{ ...styles.cardValue, color: "#0f0" }}>{summary.matched}</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f44" }}>
            <p style={styles.cardLabel}>Missing from Catalyst</p>
            <p style={{ ...styles.cardValue, color: "#f44" }}>{summary.unmatched}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <button
          onClick={() => setView("unmatched")}
          style={view === "unmatched" ? styles.tabActive : styles.tab}
        >
          Missing Products ({summary?.unmatched ?? 0})
        </button>
        <button
          onClick={() => setView("all")}
          style={view === "all" ? styles.tabActive : styles.tab}
        >
          All QB Items ({summary?.total ?? 0})
        </button>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingRight: 36, width: "100%", boxSizing: "border-box" as const }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Full Name</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Qty On Hand</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Reorder Pt</th>
              {view === "all" && <th style={{ ...styles.th, textAlign: "center" }}>Status</th>}
              <th style={styles.th}>Last Synced</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={view === "all" ? 6 : 5} style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  {items.length === 0 ? "No data yet — run a QWC sync first" : "No items match your search"}
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={styles.td}>
                    <span style={{ color: item.matchedProductId ? "#0f0" : "#f88", fontWeight: 500 }}>
                      {item.name}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: "#888" }}>{item.fullName || "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{item.quantityOnHand.toLocaleString()}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{item.reorderPoint}</td>
                  {view === "all" && (
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {item.matchedProductId ? (
                        <span style={{ background: "#1a3d1a", color: "#0f0", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", border: "1px solid #0f0" }}>
                          Matched
                        </span>
                      ) : (
                        <span style={{ background: "#3d1a1a", color: "#f44", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", border: "1px solid #f44" }}>
                          Missing
                        </span>
                      )}
                    </td>
                  )}
                  <td style={{ ...styles.td, color: "#666", fontSize: "0.8rem" }}>
                    {item.lastSyncDate ? new Date(item.lastSyncDate.replace(/Z$/, "") + "Z").toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ color: "#555", fontSize: "0.8rem", marginTop: 16 }}>
        Showing {filtered.length} of {items.length} items
      </p>
    </div>
  );
}

const styles = {
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 16,
  } as React.CSSProperties,
  card: {
    flex: 1,
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "12px 20px",
  } as React.CSSProperties,
  cardLabel: {
    margin: 0,
    color: "#888",
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  } as React.CSSProperties,
  cardValue: {
    margin: "4px 0 0",
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "bold",
  } as React.CSSProperties,
  tab: {
    background: "transparent",
    color: "#888",
    border: "1px solid #444",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
  } as React.CSSProperties,
  tabActive: {
    background: "#0f0",
    color: "#000",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  } as React.CSSProperties,
  input: {
    padding: "10px 14px",
    background: "#222",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: 6,
    fontSize: "14px",
  } as React.CSSProperties,
  th: {
    padding: "10px 12px",
    textAlign: "left" as const,
    color: "#0f0",
    borderBottom: "2px solid #333",
    fontSize: "0.85rem",
    fontWeight: 600,
  } as React.CSSProperties,
  td: {
    padding: "10px 12px",
    color: "#fff",
    fontSize: "0.9rem",
  } as React.CSSProperties,
};
