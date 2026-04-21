// src/components/FloorDashboard.tsx
import { useEffect, useState } from "react";
import axios from "../axios";
import { getConnection, startSignalR } from "../signalr";
import { useNavigate } from "react-router-dom";
import { WorkOrderCard } from "./WorkOrderCard";
import { useUserRole, canCreate, useLocation } from "../context/AuthContext";
import { usePersistedSearch } from "../hooks/usePersistedSearch";

interface ApiWorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  description?: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  quantityActual?: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  productId?: number;
  moldNumber?: string;
}

type WorkOrder = ApiWorkOrder;

export default function FloorDashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signalRStatus, setSignalRStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const navigate = useNavigate();
  const [view, setView] = useState<"floor" | "completed">("floor");
  const [floorSearch, setFloorSearch] = usePersistedSearch('floorSearch');
  const [completedSearch, setCompletedSearch] = usePersistedSearch('completedSearch');
  const [pendingCount, setPendingCount] = useState(0);
  const { location: locationFilter } = useLocation();
  const userRole = useUserRole();

  const loadPendingCount = async () => {
    try {
      const res = await axios.get<any[]>("/api/sampleapproval/pending");
      setPendingCount(res.data.length);
    } catch {
      // silent
    }
  };

  // useEffect(() => {
  //   loadPendingCount();
  //   const interval = setInterval(loadPendingCount, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  // FILTERS
  const filteredActive = workOrders
    .filter((wo) => wo.status !== "Done")
    .filter(
      (wo) =>
        wo.poNumber.toLowerCase().includes(floorSearch.toLowerCase()) ||
        wo.partNumber.toLowerCase().includes(floorSearch.toLowerCase())
    );

  const filteredCompleted = workOrders
    .filter((wo) => wo.status === "Done")
    .filter(
      (wo) =>
        wo.poNumber.toLowerCase().includes(completedSearch.toLowerCase()) ||
        wo.partNumber.toLowerCase().includes(completedSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    });

  const printWorkOrders = async (orders: WorkOrder[], title: string) => {
    const isOpen = !title.includes("Completed");
    // Fetch QB data for open orders
    let qbMap: Record<number, { onHand: number; committed: number; sales12: number; monthsLeft: string }> = {};
    if (isOpen) {
      const productIds = orders.map(wo => wo.productId).filter(Boolean) as number[];
      const unique = Array.from(new Set(productIds));
      const results = await Promise.all(unique.map(id => axios.get("/api/products/" + id).then((r: any) => r.data).catch(() => null)));
      results.forEach((p: any) => {
        if (!p) return;
        const onHand = p.qbQuantityOnHand ?? 0;
        const committed = (p.qbOnOrder ?? 0) + (p.qbAssemblyDemand ?? 0);
        const sales12 = p.qbSales12Months ?? 0;
        const reorder = p.qbReorderPoint ?? 0;
        const avgMonthly = sales12 / 12;
        const available = onHand - committed;
        const ml = avgMonthly > 0 ? (available - reorder) / avgMonthly : null;
        const monthsLeft = ml === null ? "—" : ml <= 0 ? "NOW" : ml.toFixed(1);
        qbMap[p.productID] = { onHand, committed, sales12, monthsLeft };
      });
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const qbHeaders = isOpen ? "<th class=\"right\">On Hand</th><th class=\"right\">Committed</th><th class=\"right\">12mo Sales</th><th class=\"right\">Mo. Left</th>" : "";
    const completedHeaders = !isOpen ? "<th class=\"right\">Actual Qty</th>" : "";
    const completedDateHeader = !isOpen ? "<th>Completed</th>" : "";
    const rows = orders.map(wo => {
      const due = wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "—";
      const end = wo.endDate ? new Date(wo.endDate).toLocaleDateString() : "—";
      const statusClass = wo.status === "Done" ? "done" : wo.status === "New" ? "new" : wo.status === "Active" ? "active" : "other";
      const qb = wo.productId ? qbMap[wo.productId] : null;
      const qbCells = isOpen ? "<td class=\"right\">" + (qb?.onHand?.toLocaleString() ?? "—") + "</td><td class=\"right\">" + (qb?.committed ?? "—") + "</td><td class=\"right\">" + (qb?.sales12?.toLocaleString() ?? "—") + "</td><td class=\"right\">" + (qb?.monthsLeft ?? "—") + "</td>" : "";
      return "<tr><td>" + wo.poNumber + "</td><td>" + wo.partNumber + "</td><td>" + (wo.description || "—") + "</td><td>" + wo.customerName + "</td><td class=\"center " + statusClass + "\">" + wo.status + "</td><td class=\"right\">" + wo.quantity + "</td>" + (!isOpen ? "<td class=\"right\">" + (wo.quantityActual ?? "—") + "</td>" : "") + "<td>" + due + "</td>" + (!isOpen ? "<td>" + end + "</td>" : "") + "<td>" + (wo.moldNumber || "—") + "</td>" + qbCells + "</tr>";
    }).join("");
    const html = "<html><head><title>" + title + "</title><style>body{font-family:Arial,sans-serif;margin:20px}h2{margin-bottom:4px}p.date{color:#666;font-size:12px;margin-top:0}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1a6b1a;color:white;padding:6px 8px;text-align:left}th.right{text-align:right}th.center{text-align:center}td{padding:5px 8px;border-bottom:1px solid #ddd}td.right{text-align:right}td.center{text-align:center}tr:nth-child(even){background:#f5f5f5}.done{color:#1976d2;font-weight:bold}.new{color:#d4a017;font-weight:bold}.active{color:#c00;font-weight:bold}.other{color:#666;font-weight:bold}</style></head><body><h2>" + title + "</h2><p class=\"date\">Printed: " + new Date().toLocaleString() + " | " + orders.length + " orders</p><table><thead><tr><th>PO #</th><th>Part #</th><th>Description</th><th>Customer</th><th class=\"center\">Status</th><th class=\"right\">Qty</th>" + completedHeaders + "<th>Due Date</th>" + completedDateHeader + "<th>Mold</th>" + qbHeaders + "</tr></thead><tbody>" + rows + "</tbody></table></body></html>";
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const loadWorkOrders = async () => {
    try {
      const params = locationFilter && locationFilter !== 'All' ? `?location=${locationFilter}` : '';
      const res = await axios.get<WorkOrder[]>(`/api/workorder${params}`);
      setWorkOrders(res.data);
      setLoading(false);
    } catch (err) {
      setError("Load failed");
      setLoading(false);
    }
  };

  // Load work orders on mount and when location filter changes
  useEffect(() => {
    loadWorkOrders();
  }, [locationFilter]);

  // Initialize SignalR once on mount
  useEffect(() => {
    const initSignalR = async () => {
      try {
        const conn = await startSignalR();
        setSignalRStatus("connected");
        console.log("SignalR connected – listener attaching");

        conn.on("FloorUpdate", (msg: { action: string; data: any }) => {
          console.log("🔵 FloorUpdate received:", msg);

          if (msg.action === "WorkOrderUpdated") {
            setWorkOrders((prev) =>
              prev.map((wo) =>
                wo.workOrderId === msg.data.workOrderId
                  ? { ...wo, ...msg.data }
                  : wo
              )
            );
          } else if (msg.action === "WorkOrderCreated") {
            setWorkOrders((prev) => [...prev, msg.data]);
          } else if (msg.action === "WorkOrderDeleted") {
            setWorkOrders((prev) =>
              prev.filter((wo) => wo.workOrderId !== msg.data.workOrderId)
            );
          }
        });
      } catch (err) {
        setSignalRStatus("error");
        console.error("SignalR failed", err);
      }
    };

    initSignalR();
  }, []);

  return (
    <div
      style={{
        padding: 20,
        background: "#111",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setView("floor")}
          style={{
            background: view === "floor" ? "#0f0" : "#444",
            color: view === "floor" ? "#000" : "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Open
        </button>
        <button
          onClick={() => setView("completed")}
          style={{
            background: view === "completed" ? "#0f0" : "#444",
            color: view === "completed" ? "#000" : "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Completed
        </button>

        {canCreate(userRole) && (
          <>
            <button
              onClick={() => navigate("/workorder/new")}
              style={{
                background: "#0f0",
                color: "#111",
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + New Work Order
            </button>
            <button
              onClick={() => navigate("/workorder/bulk")}
              style={{
                background: "#111",
                color: "#0f0",
                padding: "8px 16px",
                borderRadius: 8,
                border: "2px solid #0f0",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Bulk Entry
            </button>
          </>
        )}

        {/* <button
          onClick={() => navigate('/approvals')}
          style={{
            background: '#0f0',
            color: '#000',
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: '0.8rem',
            border: '3px solid #000',
            boxShadow: '0 0 10px #0f0',
            cursor: 'pointer'
          }}
        >
          APPROVALS ({pendingCount})
        </button> */}
      </div>

      {view === "floor" ? (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ position: "relative", width: "65%" }}>
              <input
                type="text"
                placeholder="Search floor..."
                value={floorSearch}
                onChange={(e) => setFloorSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  paddingRight: 36,
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #0f0",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              />
              {floorSearch && (
                <button
                  onClick={() => setFloorSearch("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer", padding: "0 4px" }}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => printWorkOrders(filteredActive, "Open Work Orders")}
              style={{ background: "#0f0", color: "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" }}
            >
              Print
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {filteredActive.map((wo) => (
              <WorkOrderCard key={wo.workOrderId} wo={wo} navigate={navigate} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ position: "relative", width: "65%" }}>
              <input
                type="text"
                placeholder="Search completed..."
                value={completedSearch}
                onChange={(e) => setCompletedSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  paddingRight: 36,
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #0f0",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              />
              {completedSearch && (
                <button
                onClick={() => setCompletedSearch("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#888", fontSize: "18px", cursor: "pointer", padding: "0 4px" }}
              >
                ✕
              </button>
            )}
            </div>
            <button
              onClick={() => printWorkOrders(filteredCompleted, "Completed Work Orders")}
              style={{ background: "#0f0", color: "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" }}
            >
              Print
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            }}
          >
            {filteredCompleted.map((wo) => (
              <WorkOrderCard key={wo.workOrderId} wo={wo} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* SIGNALR STATUS */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          fontSize: "0.8rem",
          color: signalRStatus === "connected" ? "#0f0" : "#f80",
        }}
      >
        SignalR: {signalRStatus}
      </div>
    </div>
  );
}
