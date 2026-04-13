import React, { useEffect, useState } from "react";
import axios from "../axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlySale {
  year: number;
  month: number;
  label: string;
  quantitySold: number;
  revenue: number;
}

interface Props {
  productId: number;
  onClose: () => void;
}

export default function SalesChart({ productId, onClose }: Props) {
  const [data, setData] = useState<MonthlySale[]>([]);
  const [partNumber, setPartNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"qty" | "revenue">("qty");

  useEffect(() => {
    axios
      .get<{ partNumber: string; sales: MonthlySale[] }>(`/api/products/${productId}/sales-history`)
      .then((res) => {
        setPartNumber(res.data.partNumber);
        setData(res.data.sales);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const monthNames = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const chartData = data.map((d) => ({
    name: `${monthNames[d.month]} ${d.year}`,
    qty: d.quantitySold,
    revenue: d.revenue,
  }));

  const totalQty = data.reduce((sum, d) => sum + d.quantitySold, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
          border: "1px solid #333",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, color: "#fff" }}>
            Sales History — {partNumber}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#f55",
              border: "1px solid #f55",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Close
          </button>
        </div>

        {/* Summary */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "#1a2a1a",
              border: "1px solid #2a3a2a",
              borderRadius: 8,
              padding: "10px 20px",
              flex: 1,
            }}
          >
            <p style={{ margin: 0, color: "#6a6", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Total Units Sold
            </p>
            <p style={{ margin: "4px 0 0", color: "#4f4", fontSize: "1.5rem", fontWeight: "bold" }}>
              {totalQty.toLocaleString()}
            </p>
          </div>
          <div
            style={{
              background: "#2a2a1a",
              border: "1px solid #3a3a2a",
              borderRadius: 8,
              padding: "10px 20px",
              flex: 1,
            }}
          >
            <p style={{ margin: 0, color: "#aa6", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Total Revenue
            </p>
            <p style={{ margin: "4px 0 0", color: "#ff0", fontSize: "1.5rem", fontWeight: "bold" }}>
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setViewMode("qty")}
            style={{
              background: viewMode === "qty" ? "#0a0" : "transparent",
              color: viewMode === "qty" ? "#000" : "#0a0",
              border: "1px solid #0a0",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Quantity
          </button>
          <button
            onClick={() => setViewMode("revenue")}
            style={{
              background: viewMode === "revenue" ? "#cc0" : "transparent",
              color: viewMode === "revenue" ? "#000" : "#cc0",
              border: "1px solid #cc0",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Revenue
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading...</p>
        ) : chartData.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: 40 }}>
            No sales data available. Data will appear after QuickBooks sync.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00cc00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00cc00" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cccc00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#cccc00" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#888", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={chartData.length > 24 ? Math.floor(chartData.length / 12) : 0}
              />
              <YAxis tick={{ fill: "#888" }} />
              <Tooltip
                contentStyle={{
                  background: "#222",
                  border: "1px solid #444",
                  borderRadius: 6,
                  color: "#fff",
                }}
                formatter={(value: number) =>
                  viewMode === "revenue"
                    ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : value.toLocaleString()
                }
              />
              <Legend />
              {viewMode === "qty" ? (
                <Area
                  type="monotone"
                  dataKey="qty"
                  name="Units Sold"
                  stroke="#00cc00"
                  fill="url(#gradQty)"
                  strokeWidth={2}
                  dot={chartData.length <= 24}
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  stroke="#cccc00"
                  fill="url(#gradRev)"
                  strokeWidth={2}
                  dot={chartData.length <= 24}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
