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
  const confirmCallback = useRef<(() => void) | null>(null);
  const userRole = useUserRole();
  const isReadOnly = !canEdit(userRole);

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

    requestConfirm(`Complete work order with quantity: ${qty}?`, async () => {
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
                  marginBottom: 2,
                }}
              >
                {wo.partNumber}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: 4 }}
              >
                PO: {wo.poNumber || "—"}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#ddd",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {wo.description || "No description"}
              </div>
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

            {/* Print Labels button - show for Active or Done orders */}
            {(wo.status === "Active" || wo.status === "FirstPiecePending" || wo.status === "Done") && (
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
