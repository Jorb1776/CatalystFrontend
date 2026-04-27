import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";

interface Receivable {
  id: number;
  refNumber?: string;
  customerName: string;
  txnDate: string;
  dueDate?: string;
  subtotal: number;
  balanceRemaining: number;
  daysPastDue: number;
  lastSyncDate?: string;
}

interface Bucket { amount: number; count: number; }

interface Summary {
  totalAmount: number;
  totalCount: number;
  pastDueAmount: number;
  pastDueCount: number;
  current: Bucket;
  days1to30: Bucket;
  days31to60: Bucket;
  days61to90: Bucket;
  days90plus: Bucket;
}

type Filter = "all" | "pastdue" | "current" | "d30" | "d60" | "d90" | "d90plus";
type SortKey = "refNumber" | "customerName" | "txnDate" | "dueDate" | "balanceRemaining" | "daysPastDue";
type SortDir = "asc" | "desc";

export default function ReceivablesReport() {
  const [items, setItems] = useState<Receivable[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<Filter>("pastdue");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<Summary>("/api/receivables/summary").then(r => setSummary(r.data)).catch(() => {});
    axios.get<Receivable[]>("/api/receivables").then(r => setItems(r.data)).catch(() => {});
  }, []);

  const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : "—";

  const bucketOf = (days: number): Filter => {
    if (days <= 0) return "current";
    if (days <= 30) return "d30";
    if (days <= 60) return "d60";
    if (days <= 90) return "d90";
    return "d90plus";
  };

  const filtered = items.filter(r => {
    if (search) {
      const s = search.toLowerCase();
      if (!r.customerName.toLowerCase().includes(s) && !(r.refNumber || "").toLowerCase().includes(s)) return false;
    }
    if (filter === "all") return true;
    if (filter === "pastdue") return r.daysPastDue > 40;
    return bucketOf(r.daysPastDue) === filter;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
  });

  const printReport = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const title = filter === "pastdue" ? "Past Due Receivables (40+ days)" : filter === "all" ? "All Open Receivables" : "Receivables Report";
    const rows = filtered.map(r => {
      const daysClass = r.daysPastDue > 90 ? "d90p" : r.daysPastDue > 60 ? "d90" : r.daysPastDue > 30 ? "d60" : r.daysPastDue > 0 ? "d30" : "curr";
      const daysText = r.daysPastDue <= 0 ? "Current" : r.daysPastDue + "d";
      return "<tr><td>" + (r.refNumber || "—") + "</td><td>" + r.customerName + "</td><td>" + fmt(r.txnDate) + "</td><td>" + fmt(r.dueDate) + "</td><td class=\"right\">" + money(r.balanceRemaining) + "</td><td class=\"right " + daysClass + "\">" + daysText + "</td></tr>";
    }).join("");
    const total = filtered.reduce((s, r) => s + r.balanceRemaining, 0);
    const html = "<html><head><title>" + title + "</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}tfoot td{border-top:2px solid #333;font-weight:bold;background:#eee}.curr{color:#070}.d30{color:#d90}.d60{color:#c40;font-weight:bold}.d90{color:#c00;font-weight:bold}.d90p{color:#900;font-weight:bold;background:#fee}</style></head><body><h2>" + title + "</h2><p class=\"date\">Printed: " + new Date().toLocaleString() + " | " + filtered.length + " invoices | Total: " + money(total) + "</p><table><thead><tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Due</th><th class=\"right\">Balance</th><th class=\"right\">Days</th></tr></thead><tbody>" + rows + "</tbody><tfoot><tr><td colspan=\"4\">Total</td><td class=\"right\">" + money(total) + "</td><td></td></tr></tfoot></table></body></html>";
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const total = filtered.reduce((s, r) => s + r.balanceRemaining, 0);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#0f0", margin: 0, fontSize: "1.8rem" }}>Accounts Receivable Report</h2>
        <button onClick={printReport} style={styles.printBtn}>Print</button>
      </div>

      {summary && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ ...styles.card, borderColor: "#0f0", cursor: "pointer" }} onClick={() => setFilter("all")}>
            <p style={styles.cardLabel}>Total Open</p>
            <p style={{ ...styles.cardValue, color: "#0f0" }}>{money(summary.totalAmount)}</p>
            <p style={styles.cardSub}>{summary.totalCount} invoices</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f44", cursor: "pointer" }} onClick={() => setFilter("pastdue")}>
            <p style={styles.cardLabel}>Past Due</p>
            <p style={{ ...styles.cardValue, color: "#f44" }}>{money(summary.pastDueAmount)}</p>
            <p style={styles.cardSub}>{summary.pastDueCount} invoices</p>
          </div>
          <div style={{ ...styles.card, cursor: "pointer" }} onClick={() => setFilter("current")}>
            <p style={styles.cardLabel}>Current</p>
            <p style={{ ...styles.cardValue, color: "#0f0" }}>{money(summary.current.amount)}</p>
            <p style={styles.cardSub}>{summary.current.count} invoices</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#d90", cursor: "pointer" }} onClick={() => setFilter("d30")}>
            <p style={styles.cardLabel}>1-30 Days</p>
            <p style={{ ...styles.cardValue, color: "#ff0" }}>{money(summary.days1to30.amount)}</p>
            <p style={styles.cardSub}>{summary.days1to30.count} invoices</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f70", cursor: "pointer" }} onClick={() => setFilter("d60")}>
            <p style={styles.cardLabel}>31-60 Days</p>
            <p style={{ ...styles.cardValue, color: "#f90" }}>{money(summary.days31to60.amount)}</p>
            <p style={styles.cardSub}>{summary.days31to60.count} invoices</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f44", cursor: "pointer" }} onClick={() => setFilter("d90")}>
            <p style={styles.cardLabel}>61-90 Days</p>
            <p style={{ ...styles.cardValue, color: "#f44" }}>{money(summary.days61to90.amount)}</p>
            <p style={styles.cardSub}>{summary.days61to90.count} invoices</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f44", background: "#2a1010", cursor: "pointer" }} onClick={() => setFilter("d90plus")}>
            <p style={styles.cardLabel}>90+ Days</p>
            <p style={{ ...styles.cardValue, color: "#f66" }}>{money(summary.days90plus.amount)}</p>
            <p style={styles.cardSub}>{summary.days90plus.count} invoices</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ color: "#888", fontSize: "0.85rem" }}>
          Showing <span style={{ color: "#0f0", fontWeight: "bold" }}>{filtered.length}</span> invoices | Total: <span style={{ color: "#0f0", fontWeight: "bold" }}>{money(total)}</span>
        </div>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <input type="text" placeholder="Search customer or invoice #..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingRight: 36, width: "100%", boxSizing: "border-box" as const }} />
          {search && <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}>✕</button>}
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: 30, right: 30, width: 65, height: 55, background: "#0f0", color: "#000", border: "none", borderRadius: "25%", fontSize: "13px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0, 255, 0, 0.4)", zIndex: 999, transition: "all 0.3s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >Back to Top</button>
      )}
      <div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("refNumber")}>Invoice #{sortArrow("refNumber")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("customerName")}>Customer{sortArrow("customerName")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("txnDate")}>Date{sortArrow("txnDate")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("dueDate")}>Due Date{sortArrow("dueDate")}</th>
              <th style={{ ...styles.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("balanceRemaining")}>Balance{sortArrow("balanceRemaining")}</th>
              <th style={{ ...styles.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("daysPastDue")}>Days Past Due{sortArrow("daysPastDue")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={styles.empty}>
                {items.length === 0 ? "No receivables data — run a QWC sync first" : "No invoices match your filter"}
              </td></tr>
            ) : filtered.map(r => {
              const color = r.daysPastDue > 90 ? "#f66" : r.daysPastDue > 60 ? "#f44" : r.daysPastDue > 30 ? "#f90" : r.daysPastDue > 0 ? "#ff0" : "#0f0";
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ ...styles.td, color: "#0ff" }}>{r.refNumber || "—"}</td>
                  <td style={styles.td}>{r.customerName}</td>
                  <td style={{ ...styles.td, color: "#888" }}>{fmt(r.txnDate)}</td>
                  <td style={{ ...styles.td, color: "#888" }}>{fmt(r.dueDate)}</td>
                  <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>{money(r.balanceRemaining)}</td>
                  <td style={{ ...styles.td, textAlign: "right", color, fontWeight: "bold" }}>
                    {r.daysPastDue <= 0 ? "Current" : r.daysPastDue + " days"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  backBtn: { background: "transparent", color: "#0f0", border: "1px solid #0f0", padding: "8px 16px", borderRadius: 6, cursor: "pointer", marginBottom: 16 } as React.CSSProperties,
  printBtn: { background: "#0f0", color: "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px" } as React.CSSProperties,
  card: { flex: "1 1 160px", minWidth: 140, background: "#111", border: "1px solid #333", borderRadius: 8, padding: "12px 16px", transition: "transform 0.1s" } as React.CSSProperties,
  cardLabel: { margin: 0, color: "#888", fontSize: "0.7rem", textTransform: "uppercase" as const, letterSpacing: 1 } as React.CSSProperties,
  cardValue: { margin: "4px 0 0", color: "#fff", fontSize: "1.3rem", fontWeight: "bold" } as React.CSSProperties,
  cardSub: { margin: "2px 0 0", color: "#666", fontSize: "0.7rem" } as React.CSSProperties,
  input: { padding: "10px 14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, fontSize: "14px" } as React.CSSProperties,
  th: { padding: "10px 12px", textAlign: "left" as const, color: "#0f0", borderBottom: "2px solid #333", fontSize: "0.85rem", fontWeight: 600, position: "sticky" as const, top: 52, background: "#0a0a0a", zIndex: 10 } as React.CSSProperties,
  td: { padding: "10px 12px", color: "#fff", fontSize: "0.9rem" } as React.CSSProperties,
  empty: { padding: 40, textAlign: "center" as const, color: "#666" } as React.CSSProperties,
};
