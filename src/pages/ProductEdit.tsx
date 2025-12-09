// src/pages/ProductEdit.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import ProductForm from "../components/ProductForm";
import toast from "react-hot-toast";

interface ProductEditProps {
  refreshProducts: () => void;
}

export default function ProductEdit({ refreshProducts }: ProductEditProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Deleted");
      await refreshProducts();
      navigate("/products");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleSuccess = async () => {
    await refreshProducts();
    navigate(`/products/${id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={backBtn}>
        Back
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0",
        }}
      >
        <h2 style={{ color: "#0f0" }}>Edit Product</h2>
        <button onClick={handleDelete} style={deleteBtn}>
          Delete
        </button>
      </div>
      <ProductForm
        productId={parseInt(id!)}
        onSuccess={handleSuccess}
        onCancel={() => navigate(`/products/${id}`)}
      />
    </div>
  );
}

const backBtn: React.CSSProperties = {
  background: "transparent",
  color: "#0f0",
  border: "1px solid #0f0",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
};
const deleteBtn: React.CSSProperties = {
  background: "#d33",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};
