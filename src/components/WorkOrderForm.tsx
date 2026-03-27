// src/components/WorkOrderForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Product, MoldInsert } from "../types/Product";

// Define DTO
interface WorkOrderRequest {
  poNumber: string;
  partNumber: string;
  description: string;
  moldNumber: string;
  batchQuantity: number;
  material: string;
  orderNote: string;
  customerId?: number;
  dueDate?: string;
}

interface Customer {
  customerID: number;
  name: string;
  email1?: string;
  email2?: string;
  email3?: string;
}

interface WorkOrderFormProps {
  workOrderId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function WorkOrderForm({
  onSuccess,
  onCancel,
}: WorkOrderFormProps) {
  const { id } = useParams<{ id: string }>();
  const workOrderId = id ? +id : undefined;
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Default due date to 1 month from now
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const [form, setForm] = useState<WorkOrderRequest>({
    poNumber: "",
    partNumber: "",
    description: "",
    moldNumber: "",
    batchQuantity: 0,
    material: "",
    orderNote: "",
    customerId: undefined,
    dueDate: getDefaultDueDate(),
  });

  useEffect(() => {
    axios
      .get<Product[]>("/api/products")
      .then((r) => setProducts(r.data))
      .catch(() => toast.error("Load failed"));

    axios
      .get<Customer[]>("/api/customers")
      .then((r) => {
        setCustomers(r.data);
        if (!workOrderId && r.data.length > 0) {
          setForm((prev) => ({ ...prev, customerId: r.data[0].customerID }));
        }
      })
      .catch(() => console.error("Failed to load customers"));
  }, []);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.partNumber.toLowerCase().includes(term) ||
        p.partName.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Auto-select first result when search changes and there are results
  useEffect(() => {
    if (searchTerm && filteredProducts.length > 0 && !workOrderId) {
      // Auto-select the first matching product
      const firstMatch = filteredProducts[0];
      if (!selectedProduct || selectedProduct.productID !== firstMatch.productID) {
        setSelectedProduct(firstMatch);
        setIsCustom(false);
      }
    }
  }, [searchTerm, filteredProducts, workOrderId]);

  useEffect(() => {
    if (workOrderId) {
      axios
        .get<any>(`/api/workorder/${workOrderId}`)
        .then((r) => {
          const data = r.data;
          setForm({
            poNumber: data.poNumber || "",
            partNumber: data.partNumber || "",
            description: data.description || "",
            moldNumber: data.moldNumber || "",
            batchQuantity: data.quantity || data.batchQuantity || 0,
            material: data.material || "",
            orderNote: data.orderNote || "",
            dueDate: data.dueDate ? data.dueDate.split('T')[0] : getDefaultDueDate(),
          });
          setIsCustom(true);
        })
        .catch(() => toast.error("Failed to load work order"));
    }
  }, [workOrderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (workOrderId) {
        await axios.put(`/api/workorder/${workOrderId}`, form);
        toast.success("Work Order Updated");
      } else {
        await axios.post("/api/workorder", form);
        toast.success("Work Order Created");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Save error:", err);
      // No toast here – delete has own handler
    }
  };

  const handleDelete = async () => {
    await axios.delete(`/api/workorder/${workOrderId}`).catch(() => {});
    toast.success("Work Order Deleted");
    setConfirmDelete(false);
    navigate("/floor");
  };

  useEffect(() => {
    if (selectedProduct && !isCustom) {
      setForm((prev) => ({
        ...prev,
        partNumber: selectedProduct.partNumber,
        description: selectedProduct.partName,
        moldNumber: selectedProduct.moldInsert?.fullNumber || "",
        batchQuantity: selectedProduct.batchSize || 0,
        material: selectedProduct.material?.name || "",
      }));
    }
  }, [selectedProduct, isCustom]);

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ color: "#0f0", marginBottom: 20 }}>
        {workOrderId ? "Update Work Order" : "Create Work Order"}
      </h2>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ ...field, flex: 1 }}>
          <label>Search Product</label>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select
            value={selectedProduct?.productID || ""}
            onChange={(e) => {
              const p = products.find((x) => x.productID === +e.target.value);
              setSelectedProduct(p || null);
              setSearchTerm("");
              setIsCustom(false);
            }}
            style={{ ...selectStyle, marginTop: 8 }}
            size={5}
          >
            {filteredProducts.map((p) => (
              <option key={p.productID} value={p.productID}>
                {p.partNumber} - {p.partName}
              </option>
            ))}
          </select>
        </div>

        {/* Part Image Preview */}
        {selectedProduct && (
          <div
            style={{
              width: 150,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
            }}
          >
            <div style={{ position: "relative", flexShrink: 0, width: "100%" }}>
              <img
                src={`/PartImages/${selectedProduct.partNumber}.jpg`}
                onError={(e) =>
                  (e.currentTarget.src = "/PartImages/placeholder.jpg")
                }
                onClick={() => setShowLightbox(true)}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "contain",
                  borderRadius: 6,
                  border: "2px solid #0f0",
                  cursor: "zoom-in",
                }}
                alt="Part"
              />
              {/* zoom overlay */}
              <div
                onClick={() => setShowLightbox(true)}
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
            <span style={{ color: "#888", fontSize: "0.75rem", textAlign: "center" }}>
              {selectedProduct.partNumber}
            </span>
          </div>
        )}
      </div>

      <div style={field}>
        <label>
          <input
            type="checkbox"
            checked={isCustom}
            onChange={(e) => setIsCustom(e.target.checked)}
          />{" "}
          Custom Entry
        </label>
      </div>

      <div style={grid}>
        <div style={field}>
          <label>PO Number</label>
          <input
            value={form.poNumber}
            onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
            placeholder="Enter PO number"
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Customer</label>
          <select
            value={form.customerId || ""}
            onChange={(e) => setForm({ ...form, customerId: e.target.value ? +e.target.value : undefined })}
            style={inputStyle}
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.customerID} value={c.customerID}>
                {c.name} {c.email1 ? `(${c.email1})` : "(no email)"}
              </option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label>Expected Due Date</label>
          <input
            type="date"
            value={form.dueDate || ""}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Part Number *</label>
          <input
            required
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
            disabled={!isCustom && !!selectedProduct}
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Description</label>
          <input
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={!isCustom && !!selectedProduct}
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Mold Number</label>
          <input
            value={form.moldNumber}
            onChange={(e) => setForm({ ...form, moldNumber: e.target.value })}
            disabled={!isCustom && !!selectedProduct}
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Batch Quantity *</label>
          <input
            type="number"
            required
            value={form.batchQuantity}
            onChange={(e) =>
              setForm({ ...form, batchQuantity: +e.target.value })
            }
            disabled={!isCustom && !!selectedProduct}
            style={inputStyle}
          />
        </div>
        <div style={field}>
          <label>Material</label>
          <input
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            disabled={!isCustom && !!selectedProduct}
            style={inputStyle}
          />
        </div>
        <div style={{ ...field, gridColumn: "1 / -1" }}>
          <label>Order Note</label>
          <textarea
            value={form.orderNote}
            onChange={(e) => setForm({ ...form, orderNote: e.target.value })}
            style={{ ...inputStyle, height: 80 }}
          />
        </div>
      </div>

      <div style={buttonRow}>
        {workOrderId && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            style={deleteBtn}
          >
            Delete
          </button>
        )}
        <button type="submit" style={btnStyle}>
          {workOrderId ? "Update Work Order" : "Create Work Order"}
        </button>
        <button type="button" onClick={() => navigate(-1)} style={cancelBtn}>
          Cancel
        </button>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: 8,
              width: 300,
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", color: "#f44" }}>
              Delete Work Order?
            </h3>
            <p
              style={{ fontSize: "0.9rem", margin: "0 0 16px", color: "#aaa" }}
            >
              This action cannot be undone.
            </p>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: "#444",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 4,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: "#f44",
                  color: "#000",
                  padding: "6px 12px",
                  borderRadius: 4,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showLightbox && selectedProduct && (
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
            src={`/PartImages/${selectedProduct.partNumber}.jpg`}
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
    </form>
  );
}

// Styles
const formStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "20px auto",
  padding: 24,
  background: "#111",
  borderRadius: 12,
  border: "1px solid #333",
  color: "#fff",
};
const field: React.CSSProperties = { marginBottom: 16 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#222",
  border: "1px solid #444",
  borderRadius: 6,
  color: "#fff",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "10px",
  height: "auto",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const buttonRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 24,
};
const btnStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  ...btnStyle,
  background: "#444",
  color: "#fff",
};
const deleteBtn: React.CSSProperties = {
  ...btnStyle,
  background: "#f44",
  color: "#fff",
};
