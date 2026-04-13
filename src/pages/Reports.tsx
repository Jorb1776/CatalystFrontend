import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";

interface ProductAlert {
  productID: number;
  partNumber: string;
  partName: string;
  qbQuantityOnHand: number;
  qbReorderPoint: number;
  qbSales12Months: number;
  qbOnOrder: number;
  available: number;
  avgMonthlySales: number;
  monthsUntilReorder: number | null;
  urgency: "critical" | "warning" | "watch";
  moldLocation?: string;
}

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

type ReportTab = "reorder" | "financial" | "placeholder2";

export default function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ReportTab>("reorder");
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [financialData, setFinancialData] = useState<FinancialProduct[]>([]);
  const [financialSort, setFinancialSort] = useState<"revenue" | "qty" | "price">("revenue");
  const [loading, setLoading] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "reorder") {
      loadReorderAlerts();
    } else if (activeTab === "financial") {
      loadFinancialData();
    }
  }, [activeTab]);

  const loadReorderAlerts = () => {
    setLoading(true);
    axios
      .get<any[]>("/api/products")
      .then((res) => {
        const products = res.data
          .filter((p: any) => p.qbReorderPoint > 0 && p.qbQuantityOnHand >= 0 && p.qbIsActive !== false)
          .map((p: any) => {
            const onHand = p.qbQuantityOnHand ?? 0;
            const reorder = p.qbReorderPoint ?? 0;
            const sales12 = p.qbSales12Months ?? 0;
            const onOrder = p.qbOnOrder ?? 0;
            const assemblyDemand = p.qbAssemblyDemand ?? 0;
            const totalCommitted = onOrder + assemblyDemand;
            const available = onHand - totalCommitted;
            const avgMonthly = sales12 / 12;
            const monthsLeft =
              avgMonthly > 0
                ? (available - reorder) / avgMonthly
                : available <= reorder
                  ? 0
                  : null;

            let urgency: "critical" | "warning" | "watch" = "watch";
            if (available <= reorder) urgency = "critical";
            else if (monthsLeft !== null && monthsLeft < 2) urgency = "warning";

            return {
              productID: p.productID,
              partNumber: p.partNumber,
              partName: p.partName,
              qbQuantityOnHand: onHand,
              qbReorderPoint: reorder,
              qbSales12Months: sales12,
              qbOnOrder: totalCommitted,
              available,
              avgMonthlySales: Math.round(avgMonthly),
              monthsUntilReorder: monthsLeft !== null ? Math.round(monthsLeft * 10) / 10 : null,
              urgency,
              moldLocation: p.moldInsert?.mold?.physicalLocation,
            } as ProductAlert;
          })
          .sort((a: ProductAlert, b: ProductAlert) => {
            // Critical first, then warning, then watch
            const urgencyOrder = { critical: 0, warning: 1, watch: 2 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency])
              return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            // Within same urgency, sort by months until reorder (ascending)
            const aMonths = a.monthsUntilReorder ?? 999;
            const bMonths = b.monthsUntilReorder ?? 999;
            return aMonths - bMonths;
          });

        // Find most recent sync date across all products
        const latestSync = res.data
          .map((p: any) => p.qbLastSyncDate)
          .filter(Boolean)
          .sort()
          .pop();
        if (latestSync) setLastSyncDate(latestSync);

        setAlerts(products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadFinancialData = () => {
    setLoading(true);
    axios
      .get<any[]>("/api/products")
      .then((res) => {
        const products = res.data
          .map((p: any) => {
            const sales = p.qbSales12Months ?? 0;
            const price = p.unitPrice ?? 0;
            return {
              productID: p.productID,
              partNumber: p.partNumber,
              partName: p.partName,
              unitPrice: price,
              qbSales12Months: sales,
              qbQuantityOnHand: p.qbQuantityOnHand ?? 0,
              revenue12Months: sales * price,
              moldLocation: p.moldInsert?.mold?.physicalLocation,
            } as FinancialProduct;
          })
          .filter((p: FinancialProduct) => p.qbSales12Months > 0 && (p as any).qbIsActive !== false);

        setFinancialData(products);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const sortedFinancial = [...financialData].sort((a, b) => {
    if (financialSort === "revenue") return b.revenue12Months - a.revenue12Months;
    if (financialSort === "qty") return b.qbSales12Months - a.qbSales12Months;
    return b.unitPrice - a.unitPrice;
  });

  const totalRevenue = financialData.reduce((s, p) => s + p.revenue12Months, 0);
  const totalUnitsSold = financialData.reduce((s, p) => s + p.qbSales12Months, 0);
  const avgPrice = financialData.length > 0
    ? financialData.reduce((s, p) => s + p.unitPrice, 0) / financialData.length
    : 0;

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "reorder", label: "Reorder Alerts" },
    { key: "financial", label: "Financial" },
    { key: "placeholder2", label: "Coming Soon" },
  ];

  const urgencyColors = {
    critical: { bg: "#3a1111", border: "#f44", text: "#f44", label: "CRITICAL" },
    warning: { bg: "#3a2a11", border: "#f90", text: "#f90", label: "WARNING" },
    watch: { bg: "#1a2a1a", border: "#4a4", text: "#4a4", label: "WATCH" },
  };

  const criticalCount = alerts.filter((a) => a.urgency === "critical").length;
  const warningCount = alerts.filter((a) => a.urgency === "warning").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#0f0", margin: 0 }}>Reports</h1>
        <SyncStatus lastSync={lastSyncDate} intervalMinutes={120} />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid #333",
          marginBottom: 24,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 24px",
              background: activeTab === tab.key ? "#1a1a1a" : "transparent",
              color: activeTab === tab.key ? "#0f0" : "#666",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #0f0" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: activeTab === tab.key ? "bold" : "normal",
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reorder Alerts Tab */}
      {activeTab === "reorder" && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div
              style={{
                flex: 1,
                background: "#3a1111",
                border: "1px solid #f44",
                borderRadius: 8,
                padding: "12px 20px",
              }}
            >
              <p style={{ margin: 0, color: "#f44", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Critical (At/Below Reorder)
              </p>
              <p style={{ margin: "4px 0 0", color: "#f44", fontSize: "2rem", fontWeight: "bold" }}>
                {criticalCount}
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "#3a2a11",
                border: "1px solid #f90",
                borderRadius: 8,
                padding: "12px 20px",
              }}
            >
              <p style={{ margin: 0, color: "#f90", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Warning ({"<"} 2 Months)
              </p>
              <p style={{ margin: "4px 0 0", color: "#f90", fontSize: "2rem", fontWeight: "bold" }}>
                {warningCount}
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "#1a2a1a",
                border: "1px solid #4a4",
                borderRadius: 8,
                padding: "12px 20px",
              }}
            >
              <p style={{ margin: 0, color: "#4a4", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Total Tracked
              </p>
              <p style={{ margin: "4px 0 0", color: "#4f4", fontSize: "2rem", fontWeight: "bold" }}>
                {alerts.length}
              </p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading...</p>
          ) : alerts.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>
              No products with reorder points set. Data will appear after QuickBooks sync.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #333" }}>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Part #</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Location</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>On Hand</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Committed</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Available</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Reorder Pt</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Avg/Month</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Months Left</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    const colors = urgencyColors[alert.urgency];
                    return (
                      <tr
                        key={alert.productID}
                        style={{
                          borderBottom: "1px solid #222",
                          background: colors.bg,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => navigate(`/products/${alert.productID}`)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#333")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = colors.bg)
                        }
                      >
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              letterSpacing: 1,
                            }}
                          >
                            {colors.label}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: "#0f0", fontWeight: "bold" }}>
                          {alert.partNumber}
                        </td>
                        <td style={tdStyle}>{alert.partName}</td>
                        <td style={tdStyle}>
                          {alert.moldLocation === "IN"
                            ? "Indiana"
                            : alert.moldLocation === "TN"
                              ? "Tennessee"
                              : alert.moldLocation || "—"}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {alert.qbQuantityOnHand.toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", color: alert.qbOnOrder > 0 ? "#f90" : "#555" }}>
                          {alert.qbOnOrder > 0 ? alert.qbOnOrder.toLocaleString() : "—"}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: "bold",
                            color: alert.available <= alert.qbReorderPoint ? "#f44" : "#4f4",
                          }}
                        >
                          {alert.available.toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {alert.qbReorderPoint.toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {alert.avgMonthlySales > 0
                            ? alert.avgMonthlySales.toLocaleString()
                            : "—"}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: "bold",
                            color: colors.text,
                          }}
                        >
                          {alert.monthsUntilReorder !== null
                            ? alert.monthsUntilReorder <= 0
                              ? "NOW"
                              : `${alert.monthsUntilReorder}mo`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, background: "#1a2a1a", border: "1px solid #2a3a2a", borderRadius: 8, padding: "12px 20px" }}>
              <p style={{ margin: 0, color: "#6a6", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Est. 12-Month Revenue
              </p>
              <p style={{ margin: "4px 0 0", color: "#4f4", fontSize: "1.8rem", fontWeight: "bold" }}>
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ flex: 1, background: "#2a2a1a", border: "1px solid #3a3a2a", borderRadius: 8, padding: "12px 20px" }}>
              <p style={{ margin: 0, color: "#aa6", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Total Units Sold
              </p>
              <p style={{ margin: "4px 0 0", color: "#ff0", fontSize: "1.8rem", fontWeight: "bold" }}>
                {totalUnitsSold.toLocaleString()}
              </p>
            </div>
            <div style={{ flex: 1, background: "#1a1a2a", border: "1px solid #2a2a3a", borderRadius: 8, padding: "12px 20px" }}>
              <p style={{ margin: 0, color: "#66a", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                Avg Unit Price
              </p>
              <p style={{ margin: "4px 0 0", color: "#88f", fontSize: "1.8rem", fontWeight: "bold" }}>
                ${avgPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Sort buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ color: "#666", fontSize: "0.85rem", lineHeight: "28px" }}>Sort by:</span>
            {([
              { key: "revenue" as const, label: "Revenue" },
              { key: "qty" as const, label: "Qty Sold" },
              { key: "price" as const, label: "Unit Price" },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setFinancialSort(s.key)}
                style={{
                  background: financialSort === s.key ? "#0a0" : "transparent",
                  color: financialSort === s.key ? "#000" : "#0a0",
                  border: "1px solid #0a0",
                  borderRadius: 4,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading...</p>
          ) : sortedFinancial.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>
              No financial data yet. Data will appear after QuickBooks sync.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #333" }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Part #</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Location</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Unit Price</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>12mo Qty</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>12mo Revenue</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>% of Total</th>
                    <th style={thStyle}>Revenue Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFinancial.map((p, i) => {
                    const pct = totalRevenue > 0 ? (p.revenue12Months / totalRevenue) * 100 : 0;
                    const maxRevenue = sortedFinancial[0]?.revenue12Months || 1;
                    const barWidth = (p.revenue12Months / maxRevenue) * 100;

                    return (
                      <tr
                        key={p.productID}
                        style={{
                          borderBottom: "1px solid #222",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => navigate(`/products/${p.productID}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#222")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ ...tdStyle, color: "#555", fontSize: "0.8rem" }}>{i + 1}</td>
                        <td style={{ ...tdStyle, color: "#0f0", fontWeight: "bold" }}>{p.partNumber}</td>
                        <td style={tdStyle}>{p.partName}</td>
                        <td style={tdStyle}>
                          {p.moldLocation === "IN" ? "Indiana" : p.moldLocation === "TN" ? "Tennessee" : p.moldLocation || "—"}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          ${p.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#ff0" }}>
                          {p.qbSales12Months.toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#4f4" }}>
                          ${p.revenue12Months.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", color: "#888" }}>
                          {pct.toFixed(1)}%
                        </td>
                        <td style={{ ...tdStyle, width: 150 }}>
                          <div style={{
                            height: 14,
                            borderRadius: 7,
                            background: "#111",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%",
                              width: `${barWidth}%`,
                              borderRadius: 7,
                              background: i < 3 ? "linear-gradient(90deg, #0a0, #0f0)" :
                                         i < 10 ? "linear-gradient(90deg, #060, #0a0)" :
                                         "linear-gradient(90deg, #030, #060)",
                              transition: "width 0.5s ease",
                            }} />
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
      )}

      {/* Placeholder tabs */}
      {activeTab !== "reorder" && activeTab !== "financial" && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#444",
          }}
        >
          <p style={{ fontSize: "1.2rem" }}>More reports coming soon</p>
          <p style={{ fontSize: "0.85rem" }}>
            Production analytics, quality metrics, and more will be added here.
          </p>
        </div>
      )}
    </div>
  );
}

function SyncStatus({ lastSync, intervalMinutes }: { lastSync: string | null; intervalMinutes: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  if (!lastSync) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#555" }} />
        <span style={{ color: "#555", fontSize: "0.8rem" }}>No sync data yet</span>
      </div>
    );
  }

  const lastSyncDate = new Date(lastSync);
  const msSince = now.getTime() - lastSyncDate.getTime();
  const minSince = Math.floor(msSince / 60000);
  const nextSyncIn = Math.max(0, intervalMinutes - minSince);

  const isRecent = minSince < intervalMinutes;
  const isOverdue = minSince > intervalMinutes * 1.5;
  const dotColor = isOverdue ? "#f44" : isRecent ? "#0f0" : "#f90";

  const formatAgo = (mins: number) => {
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
  };

  const formatUntil = (mins: number) => {
    if (mins <= 0) return "any moment";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#111",
      border: "1px solid #222",
      borderRadius: 8,
      padding: "8px 16px",
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: dotColor,
        boxShadow: `0 0 6px ${dotColor}`,
      }} />
      <div style={{ fontSize: "0.8rem", color: "#888" }}>
        <span>Last sync: <span style={{ color: "#ccc" }}>{formatAgo(minSince)}</span></span>
        <span style={{ margin: "0 8px", color: "#333" }}>|</span>
        <span>Next: <span style={{ color: isOverdue ? "#f44" : "#ccc" }}>~{formatUntil(nextSyncIn)}</span></span>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  color: "#888",
  fontWeight: 600,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "#ccc",
};
