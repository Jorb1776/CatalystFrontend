// src/components/PrintLabelModal.tsx
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface PrintLabelModalProps {
  workOrderId: number;
  partNumber: string;
  quantity: number;
  onClose: () => void;
}

export const PrintLabelModal = ({
  workOrderId,
  partNumber,
  quantity,
  onClose,
}: PrintLabelModalProps) => {
  const [labelCount, setLabelCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (labelCount < 1) {
      toast.error("Enter a valid label count");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post<{ location: string; printJobId: number }>("/api/printjobs", {
        workOrderId,
        labelCount,
      });

      toast.success(
        `Print job queued for ${res.data.location} (${labelCount} label${labelCount > 1 ? "s" : ""})`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to queue print job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          border: "2px solid #a855f7",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 400,
          color: "#fff",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 16,
            color: "#a855f7",
            fontSize: "1.25rem",
          }}
        >
          🏷️ Print Labels
        </h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: 4 }}>
            Part Number
          </div>
          <div style={{ color: "#0f0", fontWeight: "bold", fontSize: "1.1rem" }}>
            {partNumber}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: 4 }}>
            Quantity per Label
          </div>
          <div style={{ color: "#fff", fontSize: "1rem" }}>{quantity}</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              color: "#888",
              fontSize: "0.85rem",
              marginBottom: 8,
            }}
          >
            Number of Labels to Print
          </label>
          <input
            type="number"
            min={1}
            value={labelCount}
            onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "1.1rem",
              background: "#000",
              border: "1px solid #a855f7",
              borderRadius: 6,
              color: "#fff",
              textAlign: "center",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || labelCount < 1}
            style={{
              flex: 2,
              padding: "12px",
              background: isSubmitting ? "#6b21a8" : "#a855f7",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            {isSubmitting ? "Queuing..." : `Print ${labelCount} Label${labelCount > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};
