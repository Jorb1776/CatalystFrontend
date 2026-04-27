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
  matchedPartNumber?: string | null;
  moldNumber?: string;
  lastSyncDate?: string;
}

interface CatalystProduct {
  productID: number;
  partNumber: string;
  partName: string;
  material?: string;
  moldNumber?: string;
  location?: string;
}

interface Discrepancy {
  productId: number;
  catalystPartNumber: string;
  catalystPartName: string;
  qbName: string;
  qbFullName?: string;
  qbQuantityOnHand: number;
  issue: string;
}

interface DismissedItem {
  id: number;
  name: string;
  fullName?: string;
  quantityOnHand: number;
  dismissedReason?: string;
}

interface AssemblyComponent {
  componentPartNumber: string;
  componentName: string;
  quantity: number;
  isHardware: boolean;
  inCatalyst: boolean;
  productId?: number | null;
}

interface Assembly {
  assemblyPartNumber: string;
  assemblyName: string;
  inCatalyst: boolean;
  productId?: number | null;
  onHand: number;
  committed: number;
  onPurchaseOrder: number;
  reorderPoint: number;
  available: number;
  components: AssemblyComponent[];
}

interface Summary {
  total: number;
  matched: number;
  unmatched: number;
  catalystOnly: number;
  dismissed: number;
}

type ViewType = "unmatched" | "catalyst-only" | "discrepancies" | "assemblies" | "dismissed" | "all";

export default function QBInventoryReport() {
  const [qbItems, setQbItems] = useState<QBItem[]>([]);
  const [catalystOnly, setCatalystOnly] = useState<CatalystProduct[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [dismissedItems, setDismissedItems] = useState<DismissedItem[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [expandedAssemblies, setExpandedAssemblies] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortArrow = (key: string) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const sortFn = (a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
  };
  const [summary, setSummary] = useState<Summary | null>(null);
  const [view, setView] = useState<ViewType>("unmatched");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<Summary>("/api/qbinventory/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "unmatched" || view === "all") {
      const url = view === "unmatched" ? "/api/qbinventory/unmatched" : "/api/qbinventory";
      axios.get<QBItem[]>(url).then(r => setQbItems(r.data)).catch(() => {});
    } else if (view === "catalyst-only") {
      axios.get<CatalystProduct[]>("/api/qbinventory/catalyst-only").then(r => setCatalystOnly(r.data)).catch(() => {});
    } else if (view === "discrepancies") {
      axios.get<Discrepancy[]>("/api/qbinventory/discrepancies").then(r => setDiscrepancies(r.data)).catch(() => {});
    } else if (view === "assemblies") {
      axios.get<Assembly[]>("/api/qbinventory/assemblies").then(r => setAssemblies(r.data)).catch(() => {});
    } else if (view === "dismissed") {
      axios.get<DismissedItem[]>("/api/qbinventory/dismissed").then(r => setDismissedItems(r.data)).catch(() => {});
    }
  }, [view]);

  const refreshSummary = () => {
    axios.get<Summary>("/api/qbinventory/summary").then(r => setSummary(r.data)).catch(() => {});
  };

  const dismissItem = async (id: number, reason: string) => {
    await axios.post("/api/qbinventory/" + id + "/dismiss", { reason });
    setQbItems(prev => prev.filter(i => i.id !== id));
    refreshSummary();
  };

  const restoreItem = async (id: number) => {
    await axios.post("/api/qbinventory/" + id + "/restore");
    setDismissedItems(prev => prev.filter(i => i.id !== id));
    refreshSummary();
  };

  const searchLower = search.toLowerCase();

  const filteredQB = qbItems.filter(i =>
    i.name.toLowerCase().includes(searchLower) ||
    (i.fullName?.toLowerCase().includes(searchLower) ?? false)
  ).sort(sortFn);

  const filteredCatalyst = catalystOnly.filter(p =>
    p.partNumber.toLowerCase().includes(searchLower) ||
    p.partName.toLowerCase().includes(searchLower) ||
    (p.moldNumber?.toLowerCase().includes(searchLower) ?? false)
  ).sort(sortFn);

  const filteredDiscrepancies = discrepancies.filter(d =>
    d.catalystPartNumber.toLowerCase().includes(searchLower) ||
    d.qbName.toLowerCase().includes(searchLower)
  ).sort(sortFn);

  const renderTable = () => {
    if (view === "unmatched" || view === "all") {
      return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("name")}>QB Name{sortArrow("name")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("fullName")}>Full Name{sortArrow("fullName")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("moldNumber")}>Mold #{sortArrow("moldNumber")}</th>
              <th style={{ ...styles.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("quantityOnHand")}>Qty On Hand{sortArrow("quantityOnHand")}</th>
              <th style={{ ...styles.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("reorderPoint")}>Reorder Pt{sortArrow("reorderPoint")}</th>
              {view === "all" && <th style={{ ...styles.th, textAlign: "center", cursor: "pointer" }} onClick={() => toggleSort("matchedProductId")}>Status{sortArrow("matchedProductId")}</th>}
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("lastSyncDate")}>Last Synced{sortArrow("lastSyncDate")}</th>
              {view === "unmatched" && <th style={styles.th}></th>}
            </tr>
          </thead>
          <tbody>
            {filteredQB.length === 0 ? (
              <tr><td colSpan={view === "all" ? 6 : 5} style={styles.empty}>
                {qbItems.length === 0 ? "No data yet — run a QWC sync first" : "No items match your search"}
              </td></tr>
            ) : filteredQB.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={styles.td}>
                  <span style={{ color: item.matchedProductId ? "#0f0" : "#f88", fontWeight: 500 }}>{item.name}</span>
                </td>
                <td style={{ ...styles.td, color: "#888" }}>{item.fullName || "—"}</td>
                <td style={{ ...styles.td, color: "#0f0" }}>{item.moldNumber || "—"}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{item.quantityOnHand.toLocaleString()}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{item.reorderPoint}</td>
                {view === "all" && (
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {item.matchedProductId ? (
                      <span style={styles.badgeGreen} title={item.matchedPartNumber ? "Matched to: " + item.matchedPartNumber : ""}>
                        Matched{item.matchedPartNumber && item.matchedPartNumber.toLowerCase() !== item.name.toLowerCase() ? " → " + item.matchedPartNumber : ""}
                      </span>
                    ) : (
                      <span style={styles.badgeRed}>Missing</span>
                    )}
                  </td>
                )}
                <td style={{ ...styles.td, color: "#666", fontSize: "0.8rem" }}>
                  {item.lastSyncDate ? new Date(item.lastSyncDate.replace(/Z$/, "") + "Z").toLocaleString() : "—"}
                </td>
                {view === "unmatched" && (
                  <td style={styles.td}>
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) dismissItem(item.id, e.target.value); }}
                      style={{ background: "#333", color: "#fff", border: "1px solid #555", borderRadius: 4, padding: "4px 6px", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      <option value="" disabled>Dismiss...</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Discontinued">Discontinued</option>
                      <option value="Service/Misc">Service/Misc</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (view === "catalyst-only") {
      return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("partNumber")}>Part #{sortArrow("partNumber")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("partName")}>Part Name{sortArrow("partName")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("material")}>Material{sortArrow("material")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("moldNumber")}>Mold{sortArrow("moldNumber")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("location")}>Location{sortArrow("location")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCatalyst.length === 0 ? (
              <tr><td colSpan={5} style={styles.empty}>
                {catalystOnly.length === 0 ? "All Catalyst products are in QuickBooks" : "No items match your search"}
              </td></tr>
            ) : filteredCatalyst.map(p => (
              <tr key={p.productID} style={{ borderBottom: "1px solid #333", cursor: "pointer" }}
                onClick={() => navigate("/products/" + p.productID)}>
                <td style={styles.td}>
                  <span style={{ color: "#f88", fontWeight: 500 }}>{p.partNumber}</span>
                </td>
                <td style={styles.td}>{p.partName}</td>
                <td style={{ ...styles.td, color: "#888" }}>{p.material || "—"}</td>
                <td style={{ ...styles.td, color: "#0f0" }}>{p.moldNumber || "—"}</td>
                <td style={styles.td}>
                  {p.location && (
                    <span style={{
                      background: p.location === "IN" ? "#1a3d1a" : "#3d3d1a",
                      color: p.location === "IN" ? "#0f0" : "#ff0",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: "1px solid " + (p.location === "IN" ? "#0f0" : "#ff0"),
                    }}>{p.location === "IN" ? "Indiana" : p.location === "TN" ? "Tennessee" : p.location}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (view === "discrepancies") {
      return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("catalystPartNumber")}>Catalyst Part #{sortArrow("catalystPartNumber")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("catalystPartName")}>Catalyst Name{sortArrow("catalystPartName")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("qbName")}>QB Name{sortArrow("qbName")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("qbFullName")}>QB Full Name{sortArrow("qbFullName")}</th>
              <th style={{ ...styles.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("qbQuantityOnHand")}>QB Qty{sortArrow("qbQuantityOnHand")}</th>
              <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("issue")}>Issue{sortArrow("issue")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDiscrepancies.length === 0 ? (
              <tr><td colSpan={6} style={styles.empty}>
                {discrepancies.length === 0 ? "No discrepancies found" : "No items match your search"}
              </td></tr>
            ) : filteredDiscrepancies.map((d, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #333", cursor: "pointer" }}
                onClick={() => navigate("/products/" + d.productId)}>
                <td style={styles.td}><span style={{ color: "#0f0", fontWeight: 500 }}>{d.catalystPartNumber}</span></td>
                <td style={styles.td}>{d.catalystPartName}</td>
                <td style={{ ...styles.td, color: "#ff0" }}>{d.qbName}</td>
                <td style={{ ...styles.td, color: "#888" }}>{d.qbFullName || "—"}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{d.qbQuantityOnHand.toLocaleString()}</td>
                <td style={styles.td}><span style={styles.badgeYellow}>{d.issue}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (view === "assemblies") {
      const assemblyMap = new Map(assemblies.map(a => [a.assemblyPartNumber.toLowerCase(), a]));
      const assemblyPartNumbers = new Set(assemblies.map(a => a.assemblyPartNumber.toLowerCase()));
      // Recursive search: check assembly, direct components, and nested sub-assembly components
      const matchesSearch = (asmPartNumber: string, visited: Set<string>): boolean => {
        if (visited.has(asmPartNumber)) return false;
        visited.add(asmPartNumber);
        const asm = assemblyMap.get(asmPartNumber.toLowerCase());
        if (!asm) return false;
        if (asm.assemblyPartNumber.toLowerCase().includes(searchLower)) return true;
        if (asm.assemblyName.toLowerCase().includes(searchLower)) return true;
        for (const c of asm.components) {
          if (c.componentPartNumber.toLowerCase().includes(searchLower)) return true;
          if (c.componentName.toLowerCase().includes(searchLower)) return true;
          // Recurse into sub-assemblies
          if (assemblyPartNumbers.has(c.componentPartNumber.toLowerCase())) {
            if (matchesSearch(c.componentPartNumber, visited)) return true;
          }
        }
        return false;
      };
      const filteredAssemblies = !searchLower
        ? assemblies
        : assemblies.filter(a => matchesSearch(a.assemblyPartNumber, new Set()));

      const toggleExpand = (key: string) => {
        setExpandedAssemblies(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key); else next.add(key);
          return next;
        });
      };

      const renderComponents = (components: AssemblyComponent[], depth: number): React.ReactNode[] => {
        const rows: React.ReactNode[] = [];
        const indent = 24 + depth * 24;
        components.forEach((c, i) => {
          const isSubAssembly = assemblyPartNumbers.has(c.componentPartNumber.toLowerCase());
          const expandKey = depth + "-" + c.componentPartNumber;
          const isExpanded = expandedAssemblies.has(expandKey);
          rows.push(
            <tr key={depth + "-" + i} style={{ borderBottom: "1px solid #222", cursor: isSubAssembly || c.productId ? "pointer" : "default" }}
              onClick={(e) => {
                e.stopPropagation();
                if (isSubAssembly) { toggleExpand(expandKey); }
                else if (c.productId) { navigate("/products/" + c.productId); }
              }}>
              <td style={{ ...styles.td, paddingLeft: indent }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isSubAssembly && <span style={{ color: "#888", fontSize: "0.7rem" }}>{isExpanded ? "▼" : "►"}</span>}
                  <span style={{ color: isSubAssembly ? "#0ff" : c.inCatalyst ? "#0f0" : c.isHardware ? "#888" : "#f88", fontWeight: 500 }}>{c.componentPartNumber}</span>
                </span>
              </td>
              <td style={styles.td}>{c.componentName !== c.componentPartNumber ? c.componentName : ""}</td>
              <td style={{ ...styles.td, textAlign: "right", color: "#0ff" }}>{c.quantity}</td>
              <td style={{ ...styles.td, textAlign: "center" }}>
                {isSubAssembly
                  ? <span style={{ color: "#0ff", fontSize: "0.75rem" }}>Assembly</span>
                  : c.isHardware
                    ? <span style={{ color: "#888", fontSize: "0.75rem" }}>Hardware</span>
                    : <span style={{ color: "#0f0", fontSize: "0.75rem" }}>Part</span>}
              </td>
              <td style={{ ...styles.td, textAlign: "center" }}>
                {c.inCatalyst ? <span style={styles.badgeGreen}>Yes</span> : <span style={c.isHardware ? styles.badgeYellow : styles.badgeRed}>{c.isHardware ? "N/A" : "Missing"}</span>}
              </td>
            </tr>
          );
          if (isSubAssembly && isExpanded) {
            const subAssembly = assemblyMap.get(c.componentPartNumber.toLowerCase());
            if (subAssembly) {
              rows.push(...renderComponents(subAssembly.components, depth + 1));
            }
          }
        });
        return rows;
      };

      const printNegative = () => {
        const negative = assemblies.filter(a => a.available < 0)
          .sort((a, b) => a.available - b.available);
        const w = window.open("", "_blank");
        if (!w) return;
        const rows = negative.map(a => {
          return "<tr><td>" + a.assemblyPartNumber + "</td><td>" + (a.assemblyName !== a.assemblyPartNumber ? a.assemblyName : "") + "</td><td class=\"right\">" + a.onHand + "</td><td class=\"right\">" + a.committed + "</td><td class=\"right\">" + (a.onPurchaseOrder || "—") + "</td><td class=\"right neg\">" + a.available + "</td><td class=\"right\">" + a.reorderPoint + "</td><td class=\"right\">" + a.components.length + "</td></tr>";
        }).join("");
        const html = "<html><head><title>Assemblies Needing Production</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:2px 5px;border-bottom:1px solid #ddd;line-height:1.2}td.right{text-align:right}td.neg{color:#c00;font-weight:bold}tr:nth-child(even){background:#f5f5f5}</style></head><body><h2>Assemblies Needing Production (Negative Available)</h2><p class=\"date\">Printed: " + new Date().toLocaleString() + " | " + negative.length + " assemblies</p><table><thead><tr><th>Assembly #</th><th>Name</th><th class=\"right\">On Hand</th><th class=\"right\">Committed</th><th class=\"right\">On PO</th><th class=\"right\">Available</th><th class=\"right\">Reorder Pt</th><th class=\"right\">Comp</th></tr></thead><tbody>" + rows + "</tbody></table></body></html>";
        w.document.write(html);
        w.document.close();
        w.print();
      };

      const negativeCount = assemblies.filter(a => a.available < 0).length;

      return (
        <div>
          {negativeCount > 0 && (
            <button
              onClick={printNegative}
              style={{ background: "#f44", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px", marginBottom: 16 }}
            >
              Print Assemblies with Negative Available ({negativeCount})
            </button>
          )}
          {filteredAssemblies.length === 0 ? (
            <p style={styles.empty}>{assemblies.length === 0 ? "No assembly data — run a QWC sync first" : "No assemblies match your search"}</p>
          ) : filteredAssemblies.map(a => {
            const isExpanded = expandedAssemblies.has(a.assemblyPartNumber);
            return (
              <div key={a.assemblyPartNumber} style={{ marginBottom: 8, border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
                <div
                  onClick={() => toggleExpand(a.assemblyPartNumber)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", background: "#1a1a1a", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#888", fontSize: "0.8rem" }}>{isExpanded ? "▼" : "►"}</span>
                    <span style={{ color: a.inCatalyst ? "#0f0" : "#f88", fontWeight: "bold", fontSize: "1rem" }}>{a.assemblyPartNumber}</span>
                    <span style={{ color: "#888" }}>{a.assemblyName !== a.assemblyPartNumber ? a.assemblyName : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.8rem" }}>
                    <span style={{ color: "#888" }}>OH: <span style={{ color: "#fff" }}>{a.onHand}</span></span>
                    <span style={{ color: "#888" }}>Com: <span style={{ color: a.committed > 0 ? "#f90" : "#fff" }}>{a.committed}</span></span>
                    <span style={{ color: "#888" }}>Avail: <span style={{ color: a.available < 0 ? "#f44" : a.available <= a.reorderPoint ? "#f90" : "#0f0", fontWeight: "bold" }}>{a.available}</span></span>
                    <span style={{ color: "#888" }}>{a.components.length} components</span>
                    {a.inCatalyst ? <span style={styles.badgeGreen}>In Catalyst</span> : <span style={styles.badgeRed}>Not in Catalyst</span>}
                  </div>
                </div>
                {isExpanded && (
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: "#111" }}>
                        <th style={{ ...styles.th, paddingLeft: 24 }}>Component</th>
                        <th style={styles.th}>Name</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Qty</th>
                        <th style={{ ...styles.th, textAlign: "center" }}>Type</th>
                        <th style={{ ...styles.th, textAlign: "center" }}>In Catalyst</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderComponents(a.components, 0)}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (view === "dismissed") {
      const filteredDismissed = dismissedItems.filter(d =>
        d.name.toLowerCase().includes(searchLower)
      );
      return (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={styles.th}>QB Name</th>
              <th style={styles.th}>Full Name</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Qty On Hand</th>
              <th style={styles.th}>Reason</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {filteredDismissed.length === 0 ? (
              <tr><td colSpan={5} style={styles.empty}>No dismissed items</td></tr>
            ) : filteredDismissed.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ ...styles.td, color: "#888" }}>{item.name}</td>
                <td style={{ ...styles.td, color: "#666" }}>{item.fullName || "—"}</td>
                <td style={{ ...styles.td, textAlign: "right", color: "#666" }}>{item.quantityOnHand.toLocaleString()}</td>
                <td style={styles.td}><span style={styles.badgeYellow}>{item.dismissedReason || "—"}</span></td>
                <td style={styles.td}>
                  <button onClick={() => restoreItem(item.id)}
                    style={{ background: "transparent", color: "#0f0", border: "1px solid #0f0", borderRadius: 4, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer" }}>
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  const currentCount = view === "unmatched" || view === "all" ? filteredQB.length :
    view === "catalyst-only" ? filteredCatalyst.length :
    view === "assemblies" ? assemblies.filter(a => a.assemblyPartNumber.toLowerCase().includes(searchLower) || a.assemblyName.toLowerCase().includes(searchLower) || a.components.some(c => c.componentPartNumber.toLowerCase().includes(searchLower))).length :
    view === "dismissed" ? dismissedItems.filter(d => d.name.toLowerCase().includes(searchLower)).length :
    filteredDiscrepancies.length;

  const totalCount = view === "unmatched" || view === "all" ? qbItems.length :
    view === "catalyst-only" ? catalystOnly.length :
    view === "assemblies" ? assemblies.length :
    view === "dismissed" ? dismissedItems.length :
    discrepancies.length;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <h2 style={{ color: "#0f0", margin: "0 0 24px", fontSize: "1.8rem" }}>Data Reconciliation Report</h2>

      {summary && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Total QB Items</p>
            <p style={styles.cardValue}>{summary.total}</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#0f0" }}>
            <p style={styles.cardLabel}>Matched</p>
            <p style={{ ...styles.cardValue, color: "#0f0" }}>{summary.matched}</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#f44" }}>
            <p style={styles.cardLabel}>In QB, Not in Catalyst</p>
            <p style={{ ...styles.cardValue, color: "#f44" }}>{summary.unmatched}</p>
          </div>
          <div style={{ ...styles.card, borderColor: "#ff0" }}>
            <p style={styles.cardLabel}>In Catalyst, Not in QB</p>
            <p style={{ ...styles.cardValue, color: "#ff0" }}>{summary.catalystOnly}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setView("unmatched")} style={view === "unmatched" ? styles.tabActive : styles.tab}>
          In QB, Not Catalyst ({summary?.unmatched ?? 0})
        </button>
        <button onClick={() => setView("catalyst-only")} style={view === "catalyst-only" ? styles.tabActive : styles.tab}>
          In Catalyst, Not QB ({summary?.catalystOnly ?? 0})
        </button>
        <button onClick={() => setView("discrepancies")} style={view === "discrepancies" ? styles.tabActive : styles.tab}>
          Name Mismatches
        </button>
        <button onClick={() => setView("assemblies")} style={view === "assemblies" ? styles.tabActive : styles.tab}>
          Assemblies
        </button>
        <button onClick={() => setView("dismissed")} style={view === "dismissed" ? styles.tabActive : styles.tab}>
          Dismissed ({summary?.dismissed ?? 0})
        </button>
        <button onClick={() => setView("all")} style={view === "all" ? styles.tabActive : styles.tab}>
          All QB Items ({summary?.total ?? 0})
        </button>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingRight: 36, width: "100%", boxSizing: "border-box" as const }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}>
              ✕
            </button>
          )}
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
        {renderTable()}
      </div>
      <p style={{ color: "#555", fontSize: "0.8rem", marginTop: 16 }}>
        Showing {currentCount} of {totalCount} items
      </p>
    </div>
  );
}

const styles = {
  backBtn: { background: "transparent", color: "#0f0", border: "1px solid #0f0", padding: "8px 16px", borderRadius: 6, cursor: "pointer", marginBottom: 16 } as React.CSSProperties,
  card: { flex: 1, minWidth: 140, background: "#111", border: "1px solid #333", borderRadius: 8, padding: "12px 20px" } as React.CSSProperties,
  cardLabel: { margin: 0, color: "#888", fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: 1 } as React.CSSProperties,
  cardValue: { margin: "4px 0 0", color: "#fff", fontSize: "1.6rem", fontWeight: "bold" } as React.CSSProperties,
  tab: { background: "transparent", color: "#888", border: "1px solid #444", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px" } as React.CSSProperties,
  tabActive: { background: "#0f0", color: "#000", border: "1px solid #0f0", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: "13px", fontWeight: "bold" } as React.CSSProperties,
  input: { padding: "10px 14px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, fontSize: "14px" } as React.CSSProperties,
  th: { padding: "10px 12px", textAlign: "left" as const, color: "#0f0", borderBottom: "2px solid #333", fontSize: "0.85rem", fontWeight: 600, position: "sticky" as const, top: 52, background: "#0a0a0a", zIndex: 10 } as React.CSSProperties,
  td: { padding: "10px 12px", color: "#fff", fontSize: "0.9rem" } as React.CSSProperties,
  empty: { padding: 40, textAlign: "center" as const, color: "#666" } as React.CSSProperties,
  badgeGreen: { background: "#1a3d1a", color: "#0f0", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", border: "1px solid #0f0" } as React.CSSProperties,
  badgeRed: { background: "#3d1a1a", color: "#f44", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", border: "1px solid #f44" } as React.CSSProperties,
  badgeYellow: { background: "#3d3d1a", color: "#ff0", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", border: "1px solid #ff0" } as React.CSSProperties,
};
