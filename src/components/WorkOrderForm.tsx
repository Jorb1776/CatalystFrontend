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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<WorkOrderRequest>({
    poNumber: "",
    partNumber: "",
    description: "",
    moldNumber: "",
    batchQuantity: 0,
    material: "",
    orderNote: "",
  });

  useEffect(() => {
    axios
      .get<Product[]>("/api/products")
      .then((r) => setProducts(r.data))
      .catch(() => toast.error("Load failed"));
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

  useEffect(() => {
    if (workOrderId) {
      axios
        .get<WorkOrderRequest>(`/api/workorder/${workOrderId}`)
        .then((r) => {
          const data = r.data;
          setForm({
            poNumber: data.poNumber || "",
            partNumber: data.partNumber || "",
            description: data.description || "",
            moldNumber: data.moldNumber || "",
            batchQuantity: data.batchQuantity || 0,
            material: data.material || "",
            orderNote: data.orderNote || "",
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

      <div style={field}>
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
