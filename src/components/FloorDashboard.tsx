// src/components/FloorDashboard.tsx
import { useEffect, useState } from "react";
import axios from "../axios";
import { getConnection, startSignalR } from "../signalr";
import { useNavigate } from "react-router-dom";
import { WorkOrderCard } from "./WorkOrderCard";
import { useUserRole, canCreate } from "../hooks/useUserRole";
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

  useEffect(() => {
    const loadWorkOrders = async () => {
      try {
        const res = await axios.get<WorkOrder[]>("/api/workorder");
        setWorkOrders(res.data);
        setLoading(false);
      } catch (err) {
        setError("Load failed");
        setLoading(false);
      }
    };

    loadWorkOrders();

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
          Floor
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
          <input
            type="text"
            placeholder="Search floor..."
            value={floorSearch}
            onChange={(e) => setFloorSearch(e.target.value)}
            style={{
              width: "65%",
              padding: 12,
              background: "#222",
              color: "#fff",
              border: "1px solid #0f0",
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
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
          <input
            type="text"
            placeholder="Search completed..."
            value={completedSearch}
            onChange={(e) => setCompletedSearch(e.target.value)}
            style={{
              width: "65%",
              padding: 12,
              background: "#222",
              color: "#fff",
              border: "1px solid #0f0",
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
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
