// src/components/FeedbackWidget.tsx
import React, { useState } from "react";
import axios from "../axios";
import toast from "react-hot-toast";

const CATEGORIES = ["General", "Bug", "Suggestion", "Question"];

const FeedbackWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMessage("");
    setCategory("General");
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please enter some feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/feedback", {
        message: trimmed,
        category,
        pageUrl: window.location.href,
      });
      toast.success("Thanks for your feedback!");
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Feedback submit failed:", err);
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Send feedback"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9000,
          background: "#0f0",
          color: "#000",
          border: "none",
          borderRadius: 28,
          padding: "12px 20px",
          fontWeight: "bold",
          fontSize: 14,
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(0,255,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        💬 Feedback
      </button>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 76,
            right: 20,
            zIndex: 9001,
            width: 340,
            maxWidth: "calc(100vw - 40px)",
            background: "#111",
            border: "2px solid #0f0",
            borderRadius: 10,
            boxShadow: "0 0 30px rgba(0,255,0,0.4)",
            padding: 18,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#0f0", fontWeight: "bold", fontSize: 16 }}>
              Send Feedback
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "#0f0",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              background: "#000",
              color: "#0f0",
              border: "1px solid #0f0",
              borderRadius: 4,
              padding: "8px 10px",
              fontSize: 14,
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's working, what's broken, or what you'd like to see..."
            rows={5}
            maxLength={4000}
            autoFocus
            style={{
              width: "100%",
              background: "#000",
              color: "#0f0",
              border: "1px solid #0f0",
              borderRadius: 4,
              padding: "8px 10px",
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: 12,
              background: submitting ? "#063" : "#0f0",
              color: "#000",
              border: "none",
              borderRadius: 4,
              padding: "10px",
              fontWeight: "bold",
              fontSize: 14,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Sending..." : "Submit"}
          </button>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
