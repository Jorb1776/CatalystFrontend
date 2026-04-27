import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface BestSeller {
  productID: number;
  partNumber: string;
  partName: string;
  location?: string;
  qty: number;
  revenue: number;
  unitPrice?: number;
}

type ViewMode = "bar" | "pie";
type Metric = "qty" | "revenue";

const COLORS = [
  "#0f0", "#0ff", "#ff0", "#f90", "#f44",
  "#9f0", "#09f", "#90f", "#f09", "#fa0",
  "#0fa", "#a0f", "#fa9", "#9af", "#9fa",
  "#faa", "#aaf", "#afa", "#ffa", "#aff",
];

export default function BestSellersReport() {
  const [products, setProducts] = useState<BestSeller[]>([]);
  const [view, setView] = useState<ViewMode>("bar");
  const [metric, setMetric] = useState<Metric>("revenue");
  const [topN, setTopN] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<BestSeller[]>("/api/products/best-sellers").then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const money = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const withSales = products
    .filter(p => p.qty > 0)
    .sort((a, b) => (metric === "qty" ? b.qty - a.qty : b.revenue - a.revenue));

  const topItems = withSales.slice(0, topN);
  const otherTotal = withSales.slice(topN).reduce((s, p) => s + (metric === "qty" ? p.qty : p.revenue), 0);
  const totalAll = withSales.reduce((s, p) => s + (metric === "qty" ? p.qty : p.revenue), 0);

  const chartData = topItems.map(p => ({
    name: p.partNumber,
    fullName: p.partName,
    value: metric === "qty" ? p.qty : p.revenue,
  }));

  const pieData = otherTotal > 0
    ? [...chartData, { name: "Other", fullName: "All other products", value: otherTotal }]
    : chartData;

  const printChart = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const title = `Best Sellers (12 Months) — Top ${topN} by ${metric === "qty" ? "Quantity" : "Revenue"}`;
    const rows = topItems.map((p, i) => {
      const val = metric === "qty" ? p.qty.toLocaleString() : money(p.revenue);
      const pct = totalAll > 0 ? (((metric === "qty" ? p.qty : p.revenue) / totalAll) * 100).toFixed(1) + "%" : "—";
      return `<tr><td>${i + 1}</td><td>${p.partNumber}</td><td>${p.partName}</td><td>${p.location || "—"}</td><td class="right">${val}</td><td class="right">${pct}</td></tr>`;
    }).join("");
    const html = `<html><head><title>${title}</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}</style></head><body><h2>${title}</h2><p class="date">Printed: ${new Date().toLocaleString()}</p><table><thead><tr><th>Rank</th><th>Part #</th><th>Name</th><th>Location</th><th class="right">${metric === "qty" ? "Qty Sold" : "Revenue"}</th><th class="right">% of Total</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#0f0", margin: 0, fontSize: "1.8rem" }}>Best Sellers (12 Months)</h2>
        <button onClick={printChart} style={styles.printBtn}>Print</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMetric("revenue")} style={metric === "revenue" ? styles.tabActive : styles.tab}>By Revenue</button>
          <button onClick={() => setMetric("qty")} style={metric === "qty" ? styles.tabActive : styles.tab}>By Quantity</button>
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: 20 }}>
          <button onClick={() => setView("bar")} style={view === "bar" ? styles.tabActive : styles.tab}>Bar Chart</button>
          <button onClick={() => setView("pie")} style={view === "pie" ? styles.tabActive : styles.tab}>Pie Chart</button>
        </div>
        <div style={{ marginLeft: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#888", fontSize: "0.85rem" }}>Top</span>
          <select value={topN} onChange={e => setTopN(parseInt(e.target.value))}
            style={{ background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: "4px 8px" }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={view === "bar" ? Math.max(300, topN * 28) : 500}>
          {view === "bar" ? (
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 70, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }}
                tickFormatter={(v: number) => metric === "revenue" ? money(v) : v.toLocaleString()} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#0f0", fontSize: 11 }} width={90} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #0f0", borderRadius: 6, color: "#0f0" }}
                itemStyle={{ color: "#0f0" }}
                labelStyle={{ color: "#0f0" }}
                formatter={(v: number) => metric === "revenue" ? money(v) : v.toLocaleString()}
                labelFormatter={(label, payload) => {
                  const d: any = payload?.[0]?.payload;
                  return `${label}${d?.fullName ? " — " + d.fullName : ""}`;
                }}
              />
              <Bar dataKey="value" fill="#0f0" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={180}
                label={(e: any) => `${e.name} (${((e.value / (totalAll || 1)) * 100).toFixed(1)}%)`}
                labelLine={{ stroke: "#888" }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #0f0", borderRadius: 6, color: "#0f0" }}
                itemStyle={{ color: "#0f0" }}
                labelStyle={{ color: "#0f0" }}
                formatter={(v: number) => metric === "revenue" ? money(v) : v.toLocaleString()}
              />
              <Legend wrapperStyle={{ color: "#fff" }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: 16 }}>
        <h3 style={{ color: "#0f0", marginTop: 0, fontSize: "1rem" }}>Top {topN} — Summary</h3>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Part #</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Location</th>
              <th style={{ ...styles.th, textAlign: "right" }}>{metric === "qty" ? "Qty Sold" : "Revenue"}</th>
              <th style={{ ...styles.th, textAlign: "right" }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {topItems.map((p, i) => {
              const val = metric === "qty" ? p.qty : p.revenue;
              const pct = totalAll > 0 ? ((val / totalAll) * 100).toFixed(1) : "0";
              return (
                <tr key={p.productID} style={{ borderBottom: "1px solid #222", cursor: "pointer" }}
                  onClick={() => navigate("/products/" + p.productID)}>
                  <td style={{ ...styles.td, color: "#888" }}>{i + 1}</td>
                  <td style={{ ...styles.td, color: "#0f0", fontWeight: 500 }}>{p.partNumber}</td>
                  <td style={styles.td}>{p.partName}</td>
                  <td style={{ ...styles.td, color: "#888" }}>{p.location || "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#0ff", fontWeight: "bold" }}>
                    {metric === "qty" ? val.toLocaleString() : money(val)}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#888" }}>{pct}%</td>
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
  tab: { background: "transparent", color: "#888", border: "1px solid #444", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px" } as React.CSSProperties,
  tabActive: { background: "#0f0", color: "#000", border: "1px solid #0f0", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px", fontWeight: "bold" } as React.CSSProperties,
  th: { padding: "10px 12px", textAlign: "left" as const, color: "#0f0", borderBottom: "2px solid #333", fontSize: "0.85rem", fontWeight: 600 } as React.CSSProperties,
  td: { padding: "10px 12px", color: "#fff", fontSize: "0.9rem" } as React.CSSProperties,
};
