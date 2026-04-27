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
  qbOnPurchaseOrder: number;
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
  const [reorderSearch, setReorderSearch] = useState("");
  const [showCritical, setShowCritical] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [showWatch, setShowWatch] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [reorderSortKey, setReorderSortKey] = useState<keyof ProductAlert | "urgencyOrder">("urgencyOrder");
  const [reorderSortDir, setReorderSortDir] = useState<"asc" | "desc">("asc");

  const toggleReorderSort = (key: keyof ProductAlert | "urgencyOrder") => {
    if (reorderSortKey === key) setReorderSortDir(d => d === "asc" ? "desc" : "asc");
    else { setReorderSortKey(key); setReorderSortDir("asc"); }
  };
  const reorderArrow = (key: keyof ProductAlert | "urgencyOrder") => reorderSortKey === key ? (reorderSortDir === "asc" ? " ▲" : " ▼") : "";

  useEffect(() => {
    if (activeTab === "reorder") {
      loadReorderAlerts();
    } else if (activeTab === "financial") {
      loadFinancialData();
    }
  }, [activeTab]);

  const loadReorderAlerts = () => {
    setLoading(true);
    Promise.all([
      axios.get<any[]>("/api/products"),
      axios.get<any[]>("/api/qbinventory").catch(() => ({ data: [] as any[] })),
    ])
      .then(([prodRes, qbRes]) => {
        // Track normalized part numbers already represented by Catalyst products
        const normalize = (s: string) => {
          if (!s) return "";
          let x = s.trim();
          const pi = x.indexOf("(");
          if (pi > 0) x = x.substring(0, pi).trimEnd();
          x = x.replace(/\*+$/, "").trimEnd();
          return x.toUpperCase();
        };
        const catalystNormalized = new Set<string>(prodRes.data.map((p: any) => normalize(p.partNumber)));

        const catalystAlerts = prodRes.data
          .filter((p: any) => p.qbReorderPoint > 0 && p.qbQuantityOnHand >= 0 && p.qbIsActive !== false)
          .map((p: any) => {
            const onHand = p.qbQuantityOnHand ?? 0;
            const reorder = p.qbReorderPoint ?? 0;
            const sales12 = p.qbSales12Months ?? 0;
            const onOrder = p.qbOnOrder ?? 0;
            const assemblyDemand = p.qbAssemblyDemand ?? 0;
            const onPurchaseOrder = p.qbOnPurchaseOrder ?? 0;
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
              qbOnPurchaseOrder: onPurchaseOrder,
              available,
              avgMonthlySales: Math.round(avgMonthly),
              monthsUntilReorder: monthsLeft !== null ? Math.round(monthsLeft * 10) / 10 : null,
              urgency,
              moldLocation: p.moldInsert?.mold?.physicalLocation,
            } as ProductAlert;
          });

        // Include QB-only items with reorder points (not in Catalyst)
        const qbOnlyAlerts = (qbRes.data || [])
          .filter((q: any) =>
            q.reorderPoint > 0 &&
            q.isActive !== false &&
            !catalystNormalized.has(normalize(q.name))
          )
          .map((q: any) => {
            const onHand = q.quantityOnHand ?? 0;
            const reorder = q.reorderPoint ?? 0;
            const onOrder = q.onOrder ?? 0;
            const assemblyDemand = q.assemblyDemand ?? 0;
            const onPO = q.onPurchaseOrder ?? 0;
            const totalCommitted = onOrder + assemblyDemand;
            const available = onHand - totalCommitted;
            const monthsLeft = available <= reorder ? 0 : null;
            let urgency: "critical" | "warning" | "watch" = "watch";
            if (available <= reorder) urgency = "critical";
            return {
              productID: -q.id, // negative to avoid conflicts with real productIDs
              partNumber: q.name,
              partName: q.fullName || q.name,
              qbQuantityOnHand: onHand,
              qbReorderPoint: reorder,
              qbSales12Months: 0,
              qbOnOrder: totalCommitted,
              qbOnPurchaseOrder: onPO,
              available,
              avgMonthlySales: 0,
              monthsUntilReorder: monthsLeft,
              urgency,
              moldLocation: undefined,
            } as ProductAlert;
          });

        const products = [...catalystAlerts, ...qbOnlyAlerts]
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
        const latestSync = prodRes.data
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
      .get<any[]>("/api/products/best-sellers")
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
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: 30, right: 30, width: 65, height: 55, background: "#0f0", color: "#000", border: "none", borderRadius: "25%", fontSize: "13px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0, 255, 0, 0.4)", zIndex: 999, transition: "all 0.3s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >Back to Top</button>
      )}
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

          {/* Print Critical & Warning */}
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              if (!printWindow) return;
              const urgent = alerts.filter(a => (showCritical && a.urgency === "critical") || (showWarning && a.urgency === "warning") || (showWatch && a.urgency === "watch"))
                .sort((a, b) => {
                  const dir = reorderSortDir === "asc" ? 1 : -1;
                  if (reorderSortKey === "urgencyOrder") {
                    const order = { critical: 0, warning: 1, watch: 2 };
                    const ua = order[a.urgency], ub = order[b.urgency];
                    if (ua !== ub) return (ua - ub) * dir;
                    return ((a.monthsUntilReorder ?? 999) - (b.monthsUntilReorder ?? 999)) * dir;
                  }
                  const av: any = (a as any)[reorderSortKey];
                  const bv: any = (b as any)[reorderSortKey];
                  if (av == null && bv == null) return 0;
                  if (av == null) return 1;
                  if (bv == null) return -1;
                  if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
                  return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
                });
              const rows = urgent.map(a => {
                const loc = a.moldLocation === "IN" ? "Indiana" : a.moldLocation === "TN" ? "Tennessee" : a.moldLocation || "—";
                const ml = a.monthsUntilReorder === null ? "—" : a.monthsUntilReorder <= 0 ? "NOW" : a.monthsUntilReorder.toFixed(1);
                return "<tr><td class=\"" + a.urgency + "\">" + a.urgency.toUpperCase() + "</td><td>" + a.partNumber + "</td><td>" + a.partName + "</td><td>" + loc + "</td><td class=\"right\">" + a.qbQuantityOnHand.toLocaleString() + "</td><td class=\"right\">" + a.qbOnOrder + "</td><td class=\"right\">" + (a.qbOnPurchaseOrder || "—") + "</td><td class=\"right\">" + a.available + "</td><td class=\"right\">" + a.qbReorderPoint + "</td><td class=\"right\">" + a.avgMonthlySales + "</td><td class=\"right\">" + ml + "</td></tr>";
              }).join("");
              const selectedLabels: string[] = [];
              if (showCritical) selectedLabels.push("Critical");
              if (showWarning) selectedLabels.push("Warning");
              if (showWatch) selectedLabels.push("Watch");
              const reportTitle = selectedLabels.join(" &amp; ") + " Reorder Report";
              const html = "<html><head><title>" + reportTitle + "</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}.critical{color:#c00;font-weight:bold}.warning{color:#d90;font-weight:bold}.watch{color:#070;font-weight:bold}</style></head><body><h2>" + reportTitle + "</h2><p class=\"date\">Printed: " + new Date().toLocaleString() + " | " + urgent.length + " items</p><table><thead><tr><th>Status</th><th>Part #</th><th>Name</th><th>Loc</th><th class=\"right\">OH</th><th class=\"right\">Com</th><th class=\"right\">PO</th><th class=\"right\">Avail</th><th class=\"right\">Reorder</th><th class=\"right\">Avg/Mo</th><th class=\"right\">Mo Left</th></tr></thead><tbody>" + rows + "</tbody></table></body></html>";
              printWindow.document.write(html);
              printWindow.document.close();
              printWindow.print();
            }}
            style={{ background: "#f44", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px", marginBottom: 16 }}
          >
            Print Selected
          </button>

          {/* Urgency toggles */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: "0.85rem", marginRight: 4 }}>Show:</span>
            <button
              onClick={() => setShowCritical(!showCritical)}
              style={{
                background: showCritical ? "#f44" : "transparent",
                color: showCritical ? "#fff" : "#f44",
                border: "1px solid #f44",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: showCritical ? "bold" : "normal",
              }}
            >
              Critical
            </button>
            <button
              onClick={() => setShowWarning(!showWarning)}
              style={{
                background: showWarning ? "#f90" : "transparent",
                color: showWarning ? "#000" : "#f90",
                border: "1px solid #f90",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: showWarning ? "bold" : "normal",
              }}
            >
              Warning
            </button>
            <button
              onClick={() => setShowWatch(!showWatch)}
              style={{
                background: showWatch ? "#0f0" : "transparent",
                color: showWatch ? "#000" : "#0f0",
                border: "1px solid #0f0",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: showWatch ? "bold" : "normal",
              }}
            >
              Watch
            </button>
          </div>

          {/* Search - supports multiple part numbers separated by comma, space, or newline */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 500 }}>
              <textarea
                placeholder="Search by part # or name... (separate multiple with commas or new lines)"
                value={reorderSearch}
                onChange={e => setReorderSearch(e.target.value)}
                rows={reorderSearch.includes("\n") || reorderSearch.includes(",") ? 3 : 1}
                style={{ width: "100%", padding: "10px 36px 10px 14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, fontSize: "14px", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
              />
              {reorderSearch && (
                <button
                  onClick={() => setReorderSearch("")}
                  style={{ position: "absolute", right: 8, top: 10, background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>
            {reorderSearch && (
              <button
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;
                  const terms = reorderSearch.split(/[,\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
                  const filtered = alerts.filter(a => (showCritical && a.urgency === "critical") || (showWarning && a.urgency === "warning") || (showWatch && a.urgency === "watch")).filter(a => terms.some(t => a.partNumber.toLowerCase().includes(t) || a.partName.toLowerCase().includes(t)))
                    .sort((a, b) => {
                      const dir = reorderSortDir === "asc" ? 1 : -1;
                      if (reorderSortKey === "urgencyOrder") {
                        const order = { critical: 0, warning: 1, watch: 2 };
                        const ua = order[a.urgency], ub = order[b.urgency];
                        if (ua !== ub) return (ua - ub) * dir;
                        return ((a.monthsUntilReorder ?? 999) - (b.monthsUntilReorder ?? 999)) * dir;
                      }
                      const av: any = (a as any)[reorderSortKey];
                      const bv: any = (b as any)[reorderSortKey];
                      if (av == null && bv == null) return 0;
                      if (av == null) return 1;
                      if (bv == null) return -1;
                      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
                      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
                    });
                  const rows = filtered.map(a => {
                    const loc = a.moldLocation === "IN" ? "Indiana" : a.moldLocation === "TN" ? "Tennessee" : a.moldLocation || "—";
                    const ml = a.monthsUntilReorder === null ? "—" : a.monthsUntilReorder <= 0 ? "NOW" : a.monthsUntilReorder.toFixed(1);
                    return "<tr><td class=\"" + a.urgency + "\">" + a.urgency.toUpperCase() + "</td><td>" + a.partNumber + "</td><td>" + a.partName + "</td><td>" + loc + "</td><td class=\"right\">" + a.qbQuantityOnHand.toLocaleString() + "</td><td class=\"right\">" + a.qbOnOrder + "</td><td class=\"right\">" + (a.qbOnPurchaseOrder || "—") + "</td><td class=\"right\">" + a.available + "</td><td class=\"right\">" + a.qbReorderPoint + "</td><td class=\"right\">" + a.avgMonthlySales + "</td><td class=\"right\">" + ml + "</td></tr>";
                  }).join("");
                  const html = "<html><head><title>Reorder Report</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}.critical{color:#c00;font-weight:bold}.warning{color:#d90;font-weight:bold}.watch{color:#070;font-weight:bold}</style></head><body><h2>Reorder Alerts Report</h2><p class=\"date\">Printed: " + new Date().toLocaleString() + " | " + filtered.length + " items</p><table><thead><tr><th>Status</th><th>Part #</th><th>Name</th><th>Loc</th><th class=\"right\">OH</th><th class=\"right\">Com</th><th class=\"right\">PO</th><th class=\"right\">Avail</th><th class=\"right\">Reorder</th><th class=\"right\">Avg/Mo</th><th class=\"right\">Mo Left</th></tr></thead><tbody>" + rows + "</tbody></table></body></html>";
                  printWindow.document.write(html);
                  printWindow.document.close();
                  printWindow.print();
                }}
                style={{ background: "#0f0", color: "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" }}
              >
                🖨 Print
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Loading...</p>
          ) : alerts.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: 40 }}>
              No products with reorder points set. Data will appear after QuickBooks sync.
            </p>
          ) : (
            <div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate", borderSpacing: 0,
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #333" }}>
                    <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleReorderSort("urgencyOrder")}>Status{reorderArrow("urgencyOrder")}</th>
                    <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleReorderSort("partNumber")}>Part #{reorderArrow("partNumber")}</th>
                    <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleReorderSort("partName")}>Name{reorderArrow("partName")}</th>
                    <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleReorderSort("moldLocation")}>Location{reorderArrow("moldLocation")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("qbQuantityOnHand")}>On Hand{reorderArrow("qbQuantityOnHand")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("qbOnOrder")}>Committed{reorderArrow("qbOnOrder")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("qbOnPurchaseOrder")}>On PO{reorderArrow("qbOnPurchaseOrder")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("available")}>Available{reorderArrow("available")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("qbReorderPoint")}>Reorder Pt{reorderArrow("qbReorderPoint")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("avgMonthlySales")}>Avg/Month{reorderArrow("avgMonthlySales")}</th>
                    <th style={{ ...thStyle, textAlign: "right", cursor: "pointer" }} onClick={() => toggleReorderSort("monthsUntilReorder")}>Months Left{reorderArrow("monthsUntilReorder")}</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.filter(a => (showCritical && a.urgency === "critical") || (showWarning && a.urgency === "warning") || (showWatch && a.urgency === "watch")).filter(a => {
                    if (!reorderSearch) return true;
                    const terms = reorderSearch.split(/[,\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
                    if (terms.length === 0) return true;
                    return terms.some(t => a.partNumber.toLowerCase().includes(t) || a.partName.toLowerCase().includes(t));
                  }).sort((a, b) => {
                    const dir = reorderSortDir === "asc" ? 1 : -1;
                    if (reorderSortKey === "urgencyOrder") {
                      const order = { critical: 0, warning: 1, watch: 2 };
                      const ua = order[a.urgency];
                      const ub = order[b.urgency];
                      if (ua !== ub) return (ua - ub) * dir;
                      return ((a.monthsUntilReorder ?? 999) - (b.monthsUntilReorder ?? 999)) * dir;
                    }
                    const av: any = (a as any)[reorderSortKey];
                    const bv: any = (b as any)[reorderSortKey];
                    if (av == null && bv == null) return 0;
                    if (av == null) return 1;
                    if (bv == null) return -1;
                    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
                    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
                  }).map((alert) => {
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
                        <td style={{ ...tdStyle, textAlign: "right", color: alert.qbOnPurchaseOrder > 0 ? "#0ff" : "#555" }}>
                          {alert.qbOnPurchaseOrder > 0 ? alert.qbOnPurchaseOrder.toLocaleString() : "—"}
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
            <div>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.9rem" }}>
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
  position: "sticky",
  top: 52,
  background: "#0a0a0a",
  zIndex: 10,
  borderBottom: "2px solid #333",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "#ccc",
};
