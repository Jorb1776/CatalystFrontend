// src/components/BulkWorkOrderForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Product } from "../types/Product";

interface Customer {
  customerID: number;
  name: string;
  email1?: string;
}

interface OrderLine {
  id: number;
  poNumber: string;
  customerId?: number;
  partNumber: string;
  description: string;
  moldNumber: string;
  batchQuantity: number;
  material: string;
  orderNote: string;
  // For UI
  productId?: number;
  isValid: boolean;
}

const emptyLine = (id: number): OrderLine => ({
  id,
  poNumber: "",
  customerId: undefined,
  partNumber: "",
  description: "",
  moldNumber: "",
  batchQuantity: 0,
  material: "",
  orderNote: "",
  productId: undefined,
  isValid: false,
});

export default function BulkWorkOrderForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lines, setLines] = useState<OrderLine[]>([emptyLine(1), emptyLine(2), emptyLine(3)]);
  const [submitting, setSubmitting] = useState(false);
  const [nextId, setNextId] = useState(4);

  useEffect(() => {
    axios.get<Product[]>("/api/products").then((r) => setProducts(r.data));
    axios.get<Customer[]>("/api/customers").then((r) => setCustomers(r.data));
  }, []);

  const updateLine = useCallback((id: number, field: keyof OrderLine, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        const updated = { ...line, [field]: value };

        // If partNumber changed, try to find matching product
        if (field === "partNumber") {
          const product = products.find(
            (p) => p.partNumber.toLowerCase() === value.toLowerCase()
          );
          if (product) {
            updated.productId = product.productID;
            updated.description = product.partName;
            updated.moldNumber = product.moldInsert?.fullNumber || "";
            updated.batchQuantity = product.batchSize || updated.batchQuantity;
            updated.material = product.material?.name || "";
          } else {
            updated.productId = undefined;
          }
        }

        // Validate line
        updated.isValid = !!(updated.partNumber && updated.batchQuantity > 0);

        return updated;
      })
    );
  }, [products]);

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(nextId)]);
    setNextId((n) => n + 1);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const duplicateLine = (id: number) => {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const newLine = { ...line, id: nextId };
    setLines((prev) => [...prev, newLine]);
    setNextId((n) => n + 1);
  };

  const validLines = lines.filter((l) => l.isValid);

  const handleSubmit = async () => {
    if (validLines.length === 0) {
      toast.error("No valid orders to submit");
      return;
    }

    setSubmitting(true);
    try {
      const payload = validLines.map((l) => ({
        poNumber: l.poNumber,
        partNumber: l.partNumber,
        description: l.description,
        moldNumber: l.moldNumber,
        batchQuantity: l.batchQuantity,
        material: l.material,
        orderNote: l.orderNote,
        customerId: l.customerId,
      }));

      const res = await axios.post<{ created: number; failed: number; errors: string[] }>("/api/workorder/bulk", payload);
      toast.success(`Created ${res.data.created} work orders`);
      navigate("/floor");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create orders");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy PO/Customer down from first row
  const fillDown = (field: "poNumber" | "customerId") => {
    if (lines.length === 0) return;
    const value = lines[0][field];
    setLines((prev) =>
      prev.map((line, i) => (i === 0 ? line : { ...line, [field]: value }))
    );
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ color: "#0f0", margin: 0 }}>Bulk Work Order Entry</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fillDown("poNumber")} style={smallBtnStyle} title="Copy PO from first row to all">
            Fill PO
          </button>
          <button onClick={() => fillDown("customerId")} style={smallBtnStyle} title="Copy Customer from first row to all">
            Fill Customer
          </button>
          <button onClick={addLine} style={addBtnStyle}>
            + Add Row
          </button>
        </div>
      </div>

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>PO Number</th>
              <th style={thStyle}>Customer</th>
              <th style={{ ...thStyle, minWidth: 140 }}>Part Number *</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, width: 80 }}>Qty *</th>
              <th style={thStyle}>Mold</th>
              <th style={thStyle}>Material</th>
              <th style={{ ...thStyle, width: 60 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={line.id} style={{ background: line.isValid ? "#0f01" : "transparent" }}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>
                  <input
                    value={line.poNumber}
                    onChange={(e) => updateLine(line.id, "poNumber", e.target.value)}
                    style={inputStyle}
                    placeholder="PO#"
                  />
                </td>
                <td style={tdStyle}>
                  <select
                    value={line.customerId || ""}
                    onChange={(e) => updateLine(line.id, "customerId", e.target.value ? +e.target.value : undefined)}
                    style={{ ...inputStyle, minWidth: 120 }}
                  >
                    <option value="">--</option>
                    {customers.map((c) => (
                      <option key={c.customerID} value={c.customerID}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    list={`parts-${line.id}`}
                    value={line.partNumber}
                    onChange={(e) => updateLine(line.id, "partNumber", e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: line.productId ? "#0f0" : line.partNumber ? "#f80" : "#444",
                    }}
                    placeholder="Type or select..."
                  />
                  <datalist id={`parts-${line.id}`}>
                    {products.map((p) => (
                      <option key={p.productID} value={p.partNumber}>
                        {p.partNumber} - {p.partName}
                      </option>
                    ))}
                  </datalist>
                </td>
                <td style={tdStyle}>
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, "description", e.target.value)}
                    style={inputStyle}
                    placeholder="Description"
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={line.batchQuantity || ""}
                    onChange={(e) => updateLine(line.id, "batchQuantity", +e.target.value)}
                    style={{ ...inputStyle, width: 70, textAlign: "right" }}
                    min={0}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={line.moldNumber}
                    onChange={(e) => updateLine(line.id, "moldNumber", e.target.value)}
                    style={inputStyle}
                    placeholder="Mold#"
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={line.material}
                    onChange={(e) => updateLine(line.id, "material", e.target.value)}
                    style={inputStyle}
                    placeholder="Material"
                  />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => duplicateLine(line.id)}
                      style={iconBtnStyle}
                      title="Duplicate row"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeLine(line.id)}
                      style={{ ...iconBtnStyle, color: "#f66" }}
                      title="Remove row"
                      disabled={lines.length <= 1}
                    >
                      x
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={footerStyle}>
        <div style={{ color: "#888" }}>
          {validLines.length} of {lines.length} orders ready
          {validLines.length > 0 && (
            <span style={{ color: "#0f0", marginLeft: 8 }}>
              (Total qty: {validLines.reduce((sum, l) => sum + l.batchQuantity, 0).toLocaleString()})
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate(-1)} style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={validLines.length === 0 || submitting}
            style={{
              ...submitBtnStyle,
              opacity: validLines.length === 0 || submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Creating..." : `Create ${validLines.length} Work Orders`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 1400,
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #333",
  borderRadius: 8,
  background: "#111",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  padding: "12px 8px",
  textAlign: "left",
  borderBottom: "2px solid #0f0",
  color: "#0f0",
  fontWeight: "bold",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #333",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  background: "#222",
  border: "1px solid #444",
  borderRadius: 4,
  color: "#fff",
  fontSize: 13,
};

const smallBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "#333",
  color: "#0f0",
  border: "1px solid #0f0",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
};

const addBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 4,
  fontWeight: "bold",
  cursor: "pointer",
};

const iconBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  padding: 0,
  background: "#333",
  color: "#0f0",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 16,
  padding: "16px 0",
  borderTop: "1px solid #333",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#444",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const submitBtnStyle: React.CSSProperties = {
  padding: "10px 24px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};
