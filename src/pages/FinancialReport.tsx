import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";

interface FinancialProduct {
  productID: number;
  partNumber: string;
  partName: string;
  unitPrice: number;
  qbSales12Months: number;
  qbQuantityOnHand: number;
  revenue12Months: number;
  moldLocation?: string;
}

export default function FinancialReport() {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState<FinancialProduct[]>([]);
  const [financialSort, setFinancialSort] = useState<"revenue" | "qty" | "price">("revenue");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get<any[]>("/api/products/best-sellers")
      .then((res) => {
        const products = res.data.map((p: any) => {
          const qty = p.qty ?? 0;
          const rev = p.revenue ?? 0;
          const unitPrice = qty > 0 ? rev / qty : (p.unitPrice ?? 0);
          return {
            productID: p.productID,
            partNumber: p.partNumber,
            partName: p.partName,
            unitPrice,
            qbSales12Months: qty,
            qbQuantityOnHand: 0,
            revenue12Months: rev,
            moldLocation: p.location,
          } as FinancialProduct;
        }).filter((p: FinancialProduct) => p.qbSales12Months > 0);
        setFinancialData(products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filteredFinancial = financialData.filter(p =>
    !search ||
    p.partNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.partName.toLowerCase().includes(search.toLowerCase())
  );

  const sortedFinancial = [...filteredFinancial].sort((a, b) => {
    if (financialSort === "revenue") return b.revenue12Months - a.revenue12Months;
    if (financialSort === "qty") return b.qbSales12Months - a.qbSales12Months;
    return b.unitPrice - a.unitPrice;
  });

  const totalRevenue = filteredFinancial.reduce((s, p) => s + p.revenue12Months, 0);
  const totalUnitsSold = filteredFinancial.reduce((s, p) => s + p.qbSales12Months, 0);
  const avgPrice = filteredFinancial.length > 0
    ? filteredFinancial.reduce((s, p) => s + p.unitPrice, 0) / filteredFinancial.length
    : 0;

  const printReport = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = sortedFinancial.map((p, i) => {
      const loc = p.moldLocation === "IN" ? "Indiana" : p.moldLocation === "TN" ? "Tennessee" : p.moldLocation || "—";
      const pct = totalRevenue > 0 ? ((p.revenue12Months / totalRevenue) * 100).toFixed(1) : "0";
      return `<tr><td>${i + 1}</td><td>${p.partNumber}</td><td>${p.partName}</td><td>${loc}</td><td class="right">${money(p.unitPrice)}</td><td class="right">${p.qbSales12Months.toLocaleString()}</td><td class="right">${money(p.revenue12Months)}</td><td class="right">${pct}%</td></tr>`;
    }).join("");
    const html = `<html><head><title>Financial Report</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:separate;border-spacing:0;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}</style></head><body><h2>Financial Report — 12 Month Revenue</h2><p class="date">Printed: ${new Date().toLocaleString()} | Total: ${money(totalRevenue)} across ${sortedFinancial.length} products</p><table><thead><tr><th>#</th><th>Part #</th><th>Name</th><th>Location</th><th class="right">Avg Price</th><th class="right">12mo Qty</th><th class="right">12mo Revenue</th><th class="right">% of Total</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: 30, right: 30, width: 65, height: 55, background: "#0f0", color: "#000", border: "none", borderRadius: "25%", fontSize: "13px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0, 255, 0, 0.4)", zIndex: 999 }}
        >Back to Top</button>
      )}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#0f0", margin: 0, fontSize: "1.8rem" }}>Financial — 12 Month Revenue</h2>
        <button onClick={printReport} style={styles.printBtn}>Print</button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ ...styles.card, borderColor: "#0f0" }}>
          <p style={styles.cardLabel}>12-Month Revenue</p>
          <p style={{ ...styles.cardValue, color: "#0f0" }}>{money(totalRevenue)}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Units Sold</p>
          <p style={styles.cardValue}>{totalUnitsSold.toLocaleString()}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Avg Price</p>
          <p style={styles.cardValue}>{money(avgPrice)}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "#888", fontSize: "0.85rem" }}>Sort by:</span>
        <button onClick={() => setFinancialSort("revenue")} style={financialSort === "revenue" ? styles.tabActive : styles.tab}>Revenue</button>
        <button onClick={() => setFinancialSort("qty")} style={financialSort === "qty" ? styles.tabActive : styles.tab}>Quantity</button>
        <button onClick={() => setFinancialSort("price")} style={financialSort === "price" ? styles.tabActive : styles.tab}>Unit Price</button>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300, marginLeft: 12 }}>
          <input type="text" placeholder="Search part..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingRight: 36, width: "100%", boxSizing: "border-box" as const }} />
          {search && <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}>✕</button>}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading...</p>
      ) : (
        <div>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Part #</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Location</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Avg Price</th>
                <th style={{ ...styles.th, textAlign: "right" }}>12mo Qty</th>
                <th style={{ ...styles.th, textAlign: "right" }}>12mo Revenue</th>
                <th style={{ ...styles.th, textAlign: "right" }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedFinancial.map((p, i) => {
                const pct = totalRevenue > 0 ? (p.revenue12Months / totalRevenue) * 100 : 0;
                const maxRev = sortedFinancial[0]?.revenue12Months || 1;
                const barWidth = (p.revenue12Months / maxRev) * 100;
                const loc = p.moldLocation === "IN" ? "Indiana" : p.moldLocation === "TN" ? "Tennessee" : p.moldLocation || "—";
                return (
                  <tr key={p.productID} style={{ borderBottom: "1px solid #222", cursor: "pointer" }}
                    onClick={() => navigate("/products/" + p.productID)}>
                    <td style={{ ...styles.td, color: "#888" }}>{i + 1}</td>
                    <td style={{ ...styles.td, color: "#0f0", fontWeight: 500 }}>{p.partNumber}</td>
                    <td style={styles.td}>{p.partName}</td>
                    <td style={{ ...styles.td, color: "#888" }}>{loc}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{money(p.unitPrice)}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#ff0" }}>{p.qbSales12Months.toLocaleString()}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#0f0", fontWeight: "bold" }}>{money(p.revenue12Months)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span style={{ color: "#888", fontSize: "0.8rem", minWidth: 40 }}>{pct.toFixed(1)}%</span>
                        <div style={{ width: 80, height: 8, background: "#222", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: barWidth + "%", height: "100%", background: i < 3 ? "#0f0" : i < 10 ? "#0a0" : "#060" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: { background: "transparent", color: "#0f0", border: "1px solid #0f0", padding: "8px 16px", borderRadius: 6, cursor: "pointer", marginBottom: 16 } as React.CSSProperties,
  printBtn: { background: "#0f0", color: "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px" } as React.CSSProperties,
  card: { flex: 1, minWidth: 160, background: "#111", border: "1px solid #333", borderRadius: 8, padding: "12px 20px" } as React.CSSProperties,
  cardLabel: { margin: 0, color: "#888", fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: 1 } as React.CSSProperties,
  cardValue: { margin: "4px 0 0", color: "#fff", fontSize: "1.8rem", fontWeight: "bold" } as React.CSSProperties,
  tab: { background: "transparent", color: "#888", border: "1px solid #444", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px" } as React.CSSProperties,
  tabActive: { background: "#0f0", color: "#000", border: "1px solid #0f0", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px", fontWeight: "bold" } as React.CSSProperties,
  input: { padding: "10px 14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, fontSize: "14px" } as React.CSSProperties,
  th: { padding: "10px 12px", textAlign: "left" as const, color: "#0f0", borderBottom: "2px solid #333", fontSize: "0.85rem", fontWeight: 600, position: "sticky" as const, top: 52, background: "#0a0a0a", zIndex: 10 } as React.CSSProperties,
  td: { padding: "10px 12px", color: "#fff", fontSize: "0.9rem" } as React.CSSProperties,
};
