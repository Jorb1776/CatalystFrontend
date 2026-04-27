// src/components/WorkOrderCard.tsx - Simplified floor dashboard cards
import { useState, useEffect, useRef } from "react";
import axios from "../axios";
import { getStatusColor } from "../utils/statusColors";
import toast from "react-hot-toast";
import { red } from "@mui/material/colors";
import { ConfirmDialog } from "./ConfirmDialog";
import { StartWithPressDataModal } from "./StartWithPressDataModal";
import { PrintLabelModal } from "./PrintLabelModal";
import { useUserRole, canEdit } from "../context/AuthContext";

interface WorkOrder {
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

interface WorkOrderCardProps {
  wo: WorkOrder;
  navigate: (path: string) => void;
}

export const WorkOrderCard = ({ wo, navigate }: WorkOrderCardProps) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPressDataModal, setShowPressDataModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [hasQsi, setHasQsi] = useState<boolean | null>(null);
  const [actualQty, setActualQty] = useState<string>("");
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [qbData, setQbData] = useState<{ qbQuantityOnHand?: number; qbOnOrder?: number; qbAssemblyDemand?: number; qbSales12Months?: number } | null>(null);
  const [showDropShipModal, setShowDropShipModal] = useState(false);
  const [dropShips, setDropShips] = useState<{ id: number; quantity: number; shipDate: string; notes?: string }[]>([]);
  const [newDropQty, setNewDropQty] = useState("");
  const [newDropNotes, setNewDropNotes] = useState("");
  const confirmCallback = useRef<(() => void) | null>(null);
  const userRole = useUserRole();
  const isReadOnly = !canEdit(userRole);

  const loadDropShips = () => {
    axios.get<any[]>(`/api/workorder/${wo.workOrderId}/drop-ships`)
      .then(r => setDropShips(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDropShips([]));
  };

  useEffect(() => {
    if (wo.productId && wo.status !== "Done") {
      axios.get(`/api/products/${wo.productId}`)
        .then((res: any) => setQbData({ qbQuantityOnHand: res.data.qbQuantityOnHand, qbOnOrder: res.data.qbOnOrder, qbAssemblyDemand: res.data.qbAssemblyDemand, qbSales12Months: res.data.qbSales12Months }))
        .catch(() => {});
    }
    loadDropShips();
  }, [wo.productId, wo.status, wo.workOrderId]);

  const dropShipTotal = dropShips.reduce((s, d) => s + d.quantity, 0);

  const addDropShip = async () => {
    const qty = parseInt(newDropQty);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    try {
      await axios.post(`/api/workorder/${wo.workOrderId}/drop-ships`, { quantity: qty, notes: newDropNotes || null });
      setNewDropQty("");
      setNewDropNotes("");
      loadDropShips();
      toast.success("Drop ship logged");
    } catch {
      toast.error("Failed to log drop ship");
    }
  };

  const deleteDropShip = async (id: number) => {
    try {
      await axios.delete(`/api/workorder/${wo.workOrderId}/drop-ships/${id}`);
      loadDropShips();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const requestConfirm = (msg: string, onYes: () => void) => {
    setConfirmMsg(msg);
    confirmCallback.current = onYes;
  };

  const btnStyle = (bg: string, color: string) => ({
    fontSize: "0.7rem" as const,
    padding: "8px 4px" as const,
    borderRadius: 5,
    fontWeight: "bold" as const,
    border: "none" as const,
    cursor: "pointer" as const,
    background: bg,
    color: color,
    transition: "box-shadow 0.2s" as const,
    height: "38px" as const, // fixed height instead of minHeight
    boxSizing: "border-box" as const,
    width: "100%" as const,
    textAlign: "center" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  });

  const btnFullStyle = (bg: string, color: string) => ({
    ...btnStyle(bg, color),
    height: "44px" as const, // taller full-width buttons
    padding: "8px 4px" as const,
    fontSize: "0.75rem" as const,
  });

  console.log(
    `🟢 [Card ${wo.workOrderId}] Rendering with status: ${wo.status}`
  );

  useEffect(() => {
    if (wo.productId) {
      checkQsiExists();
    } else {
      setHasQsi(null);
    }
  }, [wo.productId]);

  // Reset local input when the WO is updated externally (SignalR)
  useEffect(() => {
    if (wo.status === "Done" || wo.status === "New") {
      setActualQty("");
    } else if (
      (wo.status === "FirstPiecePending" || wo.status === "Active") &&
      !actualQty
    ) {
      setActualQty(wo.quantity.toString());
    }
  }, [wo.workOrderId, wo.status, wo.quantity, wo.quantityActual]);

  const checkQsiExists = async () => {
    if (!wo.productId) return;
    try {
      await axios.get(`/api/qsi/product/${wo.productId}`);
      setHasQsi(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasQsi(false);
      } else {
        setHasQsi(null);
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleUndoStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm("Undo start and return to New?", async () => {
      try {
        axios.post(`/api/workorder/${wo.workOrderId}/undo-start`);
      } catch {
        toast.error("Start failed");
      }
    });
  };

  const handleFinish = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const qty = parseInt(actualQty);
    if (!qty || qty <= 0) return;

    const totalDelivered = qty + dropShipTotal;
    const msg = dropShipTotal > 0
      ? `Complete work order? Produced: ${qty.toLocaleString()} + Drop shipped: ${dropShipTotal.toLocaleString()} = Total delivered: ${totalDelivered.toLocaleString()}`
      : `Complete work order with quantity: ${qty}?`;
    requestConfirm(msg, async () => {
      try {
        axios.post(`/api/workorder/${wo.workOrderId}/complete`, {
          quantityActual: qty,
        });
        setActualQty("");
        toast.success("Work order completed");
      } catch {
        toast.error("Complete failed");
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // stops form submit / newline
      handleFinish();
    }
  };

  const resendEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/workorder/${wo.workOrderId}/resend-email`);
      toast.success("Email resent");
    } catch (err: any) {
      toast.error("Failed to resend email");
    }
  };

  return (
    <>
      {/* Main card container - no click here */}
      <div
        style={{
          border: "2px solid #0f0",
          borderRadius: 8,
          background: "#111",
          color: "#fff",
          fontSize: "0.85rem",
          lineHeight: 1.4,
          display: "flex",
          flexDirection: "column",
          minHeight: 240,
          transition: "box-shadow 0.2s, transform 0.1s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px #0f0";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Clickable top section */}
        <div
          onClick={() =>
            !isReadOnly && navigate(`/workorder/edit/${wo.workOrderId}`)
          }
          style={{
            padding: 12,
            paddingBottom: 0,
            cursor: isReadOnly ? "default" : "pointer",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              paddingBottom: 0,
            }}
          >
            {/* Part Image + zoom */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={`/PartImages/${wo.partNumber}.jpg`}
                onError={(e) =>
                  (e.currentTarget.src = "/PartImages/placeholder.jpg")
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLightbox(true);
                }}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "2px solid #0f0",
                  cursor: "zoom-in",
                }}
                alt="Part"
              />
              {/* zoom overlay */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLightbox(true);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 6,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0f0"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
            </div>

            {/* Key Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  color: "#0f0",
                  marginBottom: 4,
                  paddingRight: 90,
                }}
              >
                {wo.partNumber}
              </div>
              {wo.productId && (
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/products/${wo.productId}`); }}
                    style={{
                      background: "transparent",
                      border: "1px solid #555",
                      color: "#888",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: "0.65rem",
                      cursor: "pointer",
                    }}
                    title="View part details"
                  >
                    Details →
                  </button>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div
              style={
                {
                  position: "absolute",
                  top: 8,
                  right: 8,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: getStatusColor(wo.status),
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  boxShadow: "0 0 10px 2px " + getStatusColor(wo.status),
                  animation:
                    wo.status === "Active" || wo.status === "FirstPiecePending"
                      ? "pulse 2s infinite"
                      : "none",
                  "--glow-color": getStatusColor(wo.status), // dynamic color for pulse
                } as React.CSSProperties
              }
            >
              {wo.status === "FirstPiecePending" || wo.status === "Active"
                ? "Running"
                : wo.status}
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              fontSize: "0.75rem",
              padding: "8px 0",
              borderTop: "1px solid #333",
              borderBottom: "1px solid #333",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#888" }}>PO:</span>{" "}
              <span style={{ color: "#fff" }}>{wo.poNumber || "—"}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#888" }}>Desc:</span>{" "}
              <span style={{ color: "#ddd" }}>{wo.description || "—"}</span>
            </div>
            <div>
              <span style={{ color: "#888" }}>Qty:</span>{" "}
              <span style={{ color: "#0f0", fontWeight: "bold" }}>
                {wo.quantity}
              </span>
            </div>
            <div>
              <span style={{ color: "#888" }}>Due:</span>{" "}
              <span style={{ color: "#fff" }}>{formatDate(wo.dueDate)}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#888" }}>Customer:</span>{" "}
              <span style={{ color: "#fff" }}>{wo.customerName || "—"}</span>
            </div>
            {wo.moldNumber && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#888" }}>Mold:</span>{" "}
                <span style={{ color: "#0f0", fontWeight: "500" }}>
                  {wo.moldNumber}
                </span>
              </div>
            )}
            {qbData && wo.status !== "Done" && (
              <>
                <div>
                  <span style={{ color: "#888" }}>On Hand:</span>{" "}
                  <span style={{ color: (qbData.qbQuantityOnHand ?? 0) > 0 ? "#4f4" : "#f44", fontWeight: "bold" }}>
                    {qbData.qbQuantityOnHand?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888" }}>Committed:</span>{" "}
                  <span style={{ color: "#ff0" }}>
                    {((qbData.qbOnOrder ?? 0) + (qbData.qbAssemblyDemand ?? 0)).toLocaleString()}
                  </span>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "#888" }}>12mo Sales:</span>{" "}
                  <span style={{ color: "#0ff" }}>
                    {qbData.qbSales12Months?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom action area - unified button styles */}
        <div style={{ padding: 12, marginTop: 10 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
          >
            {wo.productId && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/qsi/${wo.productId}`);
                  }}
                  style={btnStyle("#484848", "#0f0")}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 0 15px #0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      hasQsi === false ? "0 0 8px #f33" : "none")
                  }
                  title={hasQsi === false ? "QSI NOT CREATED!" : "View QSI"}
                >
                  {hasQsi === null
                    ? "..."
                    : hasQsi === false
                    ? "CREATE QSI"
                    : "QSI"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${wo.productId}/setup-sheet`);
                  }}
                  style={btnStyle("#484848", "#0f0")}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 0 15px #0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                  title="Setup Sheet / Tool Run Journal"
                >
                  Setup Sheet
                </button>
              </>
            )}

            {/* Print Labels button - hidden */}
            {false && (wo.status === "Active" || wo.status === "FirstPiecePending" || wo.status === "Done") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPrintModal(true);
                }}
                style={{
                  ...btnStyle("#6b21a8", "#fff"),
                  gridColumn: wo.status === "Done" ? "1 / -1" : "auto",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 15px #a855f7")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "none")
                }
                title="Print product labels"
              >
                🏷️ PRINT LABELS
              </button>
            )}

            {wo.status === "New" && !isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (wo.productId) {
                    setShowPressDataModal(true);
                  } else {
                    toast.error("No product linked to this work order");
                  }
                }}
                style={{
                  ...btnStyle("#0f0", "#000"),
                  gridColumn: "1 / -1",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 20px #0f0")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                START
              </button>
            )}

            {["FirstPiecePending", "Active"].includes(wo.status) &&
              !isReadOnly && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDropShipModal(true); }}
                    style={{
                      ...btnStyle("#0af", "#fff"),
                      gridColumn: "1 / -1",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 15px #0af")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    DROP SHIP {dropShipTotal > 0 ? `(${dropShipTotal.toLocaleString()})` : ""}
                  </button>
                  <button
                    onClick={handleUndoStart}
                    style={{
                      ...btnStyle("#ffe600ff", "#000000ff"),
                      gridColumn: "1 / -1",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow = "0 0 15px #fff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    UNDO START
                  </button>
                  <input
                    type="number"
                    min="0"
                    placeholder="Actual Qty"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{
                      ...btnStyle("#000", "#0f0"),
                      border: "solid thin #0f0",
                      fontSize: "0.85rem",
                      minHeight: 36,
                      gridColumn: "1 / -1",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={handleFinish}
                    disabled={!actualQty || parseInt(actualQty) <= 0}
                    style={{
                      ...btnStyle("#0af", "#000"),
                      opacity: !actualQty || parseInt(actualQty) <= 0 ? 0.6 : 1,
                      cursor:
                        !actualQty || parseInt(actualQty) <= 0
                          ? "not-allowed"
                          : "pointer",
                      gridColumn: "1 / -1",
                    }}
                    onMouseEnter={(e) =>
                      !e.currentTarget.disabled &&
                      (e.currentTarget.style.boxShadow = "0 0 15px #0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    FINISH
                  </button>
                </>
              )}

            {wo.status === "Done" && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: 6,
                    background: "#1a1a1a",
                  }}
                >
                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.65rem",
                      marginBottom: 4,
                    }}
                  >
                    Completed: {formatDate(wo.endDate)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#888", fontSize: "0.7rem" }}>
                      Ordered: {wo.quantity}
                    </span>
                    <span style={{ color: "#888", fontSize: "0.7rem" }}>•</span>
                    <span
                      style={{
                        color: "#0f0",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      Actual: {wo.quantityActual ?? wo.quantity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={resendEmail}
                  style={btnStyle("#0f0", "#000")}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 0 15px #0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  RESEND EMAIL
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmMsg && (
        <ConfirmDialog
          message={confirmMsg}
          onConfirm={() => {
            confirmCallback.current?.();
            confirmCallback.current = null;
            setConfirmMsg(null);
          }}
          onCancel={() => {
            confirmCallback.current = null;
            setConfirmMsg(null);
          }}
        />
      )}

      {showPressDataModal && (
        <StartWithPressDataModal
          workOrderId={wo.workOrderId}
          onClose={() => setShowPressDataModal(false)}
          onSuccess={() => {
            setShowPressDataModal(false);
          }}
        />
      )}

      {showPrintModal && (
        <PrintLabelModal
          workOrderId={wo.workOrderId}
          partNumber={wo.partNumber}
          quantity={wo.quantity}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showDropShipModal && (
        <div
          onClick={() => setShowDropShipModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1a1a", border: "1px solid #0af", borderRadius: 12, padding: 24, width: "90%", maxWidth: 500, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#0af" }}>Drop Ships — {wo.partNumber}</h3>
              <button onClick={() => setShowDropShipModal(false)}
                style={{ background: "transparent", color: "#f44", border: "1px solid #f44", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}>
                Close
              </button>
            </div>

            <div style={{ marginBottom: 16, color: "#888", fontSize: "0.85rem" }}>
              PO #{wo.poNumber || "—"} | Ordered: {wo.quantity.toLocaleString()} | Drop Shipped: <span style={{ color: "#0af", fontWeight: "bold" }}>{dropShipTotal.toLocaleString()}</span>
            </div>

            {dropShips.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #333", color: "#0af" }}>Date</th>
                    <th style={{ textAlign: "right", padding: 6, borderBottom: "1px solid #333", color: "#0af" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #333", color: "#0af" }}>Notes</th>
                    <th style={{ borderBottom: "1px solid #333" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dropShips.map(d => (
                    <tr key={d.id}>
                      <td style={{ padding: 6, borderBottom: "1px solid #222" }}>{new Date(d.shipDate).toLocaleDateString()}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #222", textAlign: "right" }}>{d.quantity.toLocaleString()}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #222", color: "#888" }}>{d.notes || "—"}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #222" }}>
                        <button onClick={() => deleteDropShip(d.id)}
                          style={{ background: "transparent", color: "#f44", border: "1px solid #f44", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.75rem" }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ borderTop: "1px solid #333", paddingTop: 16 }}>
              <h4 style={{ margin: "0 0 8px", color: "#0af", fontSize: "0.95rem" }}>Add Drop Ship</h4>
              <input type="number" min="1" placeholder="Quantity" value={newDropQty}
                onChange={e => setNewDropQty(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, marginBottom: 8, boxSizing: "border-box" }} />
              <input type="text" placeholder="Notes (optional)" value={newDropNotes}
                onChange={e => setNewDropNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 6, marginBottom: 12, boxSizing: "border-box" }} />
              <button onClick={addDropShip}
                style={{ width: "100%", background: "#0af", color: "#fff", border: "none", padding: "10px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>
                Log Drop Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showLightbox && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={`/PartImages/${wo.partNumber}.jpg`}
            onError={(e) =>
              (e.currentTarget.src = "/PartImages/placeholder.jpg")
            }
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              border: "3px solid #0f0",
              borderRadius: 8,
            }}
            alt="Part enlarged"
          />
        </div>
      )}
    </>
  );
};
