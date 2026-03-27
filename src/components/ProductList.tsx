import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import { Product } from "../types/Product";
import toast from "react-hot-toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUserRole, canCreate, canEdit, canDelete, useLocation } from "../context/AuthContext";
import { usePersistedSearch } from "../hooks/usePersistedSearch";

interface ProductListProps {
  products: Product[];
  onDelete?: () => void;
  refreshProducts: (location?: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onDelete,
  refreshProducts,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = usePersistedSearch('productSearch');
  const [filterMaterial, setFilterMaterial] = usePersistedSearch('productMaterial');
  const [filterColor, setFilterColor] = usePersistedSearch('productColor');
  const { location: globalLocation } = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const userRole = useUserRole();

  // Reload products when global location filter changes
  useEffect(() => {
    const loc = globalLocation && globalLocation !== 'All' ? globalLocation : undefined;
    refreshProducts(loc);
  }, [globalLocation]);

  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const confirmCallback = useRef<() => void>(() => {});

  const requestConfirm = (msg: string, callback: () => void) => {
    setConfirmMessage(msg);
    confirmCallback.current = callback;
    setConfirmOpen(true);
  };

  const materials = Array.from(
    new Set(products.map((p) => p.material?.name).filter(Boolean))
  );

  const colors = Array.from(
    new Set(products.map((p) => p.colorant?.name).filter(Boolean))
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.partName?.toLowerCase().includes(search.toLowerCase()) ||
      p.moldInsert?.fullNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.moldInsert?.baseNumber?.toLowerCase().includes(search.toLowerCase());

    const matchesMaterial =
      !filterMaterial || p.material?.name === filterMaterial;
    const matchesColor = !filterColor || p.colorant?.name === filterColor;

    return matchesSearch && matchesMaterial && matchesColor;
  });

  const handleDelete = async (id: number) => {
    requestConfirm("Delete product?", async () => {
      try {
        await axios.delete(`/api/products/${id}`);
        toast.success("Product deleted");
        onDelete?.();
        refreshProducts();
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            width: 65,
            height: 55,
            background: "#0f0",
            color: "#000",
            border: "none",
            borderRadius: "25%",
            fontSize: "17px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0, 255, 0, 0.4)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Back to top"
        >
          Back to Top
        </button>
      )}

      {/* Confirm Dialog */}
      {confirmOpen && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={() => {
            confirmCallback.current();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div style={{ padding: 20 }}>
        <h2 style={{ color: "#0f0", marginBottom: 16 }}>Products</h2>

        <div style={filterBar}>
          <input
            type="text"
            placeholder="Search products or mold numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            style={filterSelect}
          >
            <option value="">All Materials</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            style={filterSelect}
          >
            <option value="">All Colors</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {canCreate(userRole) && (
            <button onClick={() => navigate("/products/new")} style={newBtn}>
              New Product
            </button>
          )}
        </div>

        <div style={grid}>
          {filteredProducts.map((p) => (
            <div key={p.productID} style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  padding: "4px 0", // tiny buffer top/bottom
                }}
              >
                {/* Left — Part Number */}
                <div
                  style={{
                    color: "#0f0",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    margin: 0,
                    padding: 0,
                    letterSpacing: "0.5px",
                  }}
                >
                  {p.partNumber}
                </div>

                {/* Right — Button */}
                <button
                  onClick={() => navigate(`/products/${p.productID}`)}
                  style={{
                    ...detailsBtn,
                    whiteSpace: "nowrap", // prevents button text wrap
                  }}
                >
                  Details →
                </button>
              </div>

              <p>{p.partName}</p>
              <p>
                <strong>Material:</strong> {p.material?.name || "None"}
              </p>
              <p>
                <strong>Color:</strong> {p.colorant?.name || "None"}
              </p>
              <p>
                <strong>Mold:</strong> {p.moldInsert?.fullNumber || "None"}
              </p>
              <p>
                <strong>Full Box Qty:</strong> {p.fullBoxQty || "0"}
              </p>
              <p>
                <strong>Box Size:</strong> {p.boxSize || "—"}
              </p>
              <p>
                <strong>Bin ID:</strong> {p.binId || "—"}
              </p>

              {(canEdit(userRole) || canDelete(userRole)) && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: "1px solid #333",
                  }}
                >
                  {canEdit(userRole) && (
                    <button
                      onClick={() => navigate(`/products/${p.productID}/edit`)}
                      style={editBtn}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete(userRole) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.productID);
                      }}
                      style={deleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProductList;

const filterBar: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 20,
  flexWrap: "wrap",
  alignItems: "center",
};

const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: "10px 12px",
  background: "#222",
  border: "1px solid #444",
  borderRadius: 8,
  color: "#fff",
  fontSize: "15px",
};

const filterSelect: React.CSSProperties = {
  padding: "10px 12px",
  background: "#222",
  border: "1px solid #0f0",
  borderRadius: 8,
  color: "#0f0",
  fontSize: "14px",
  minWidth: 140,
};

const newBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
};

const card: React.CSSProperties = {
  background: "#222",
  padding: 16,
  borderRadius: 12,
  color: "#fff",
  border: "1px solid #333",
  transition: "transform 0.2s",
  cursor: "default",
};

const detailsBtn: React.CSSProperties = {
  background: "transparent",
  color: "#0f0",
  border: "1px solid #0f0",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: "13px",
  cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
  background: "transparent",
  color: "#d33",
  border: "1px solid #d33",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: "13px",
  cursor: "pointer",
  flex: 1,
};

const editBtn: React.CSSProperties = {
  background: "transparent",
  color: "#0f0",
  border: "1px solid #0f0",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: "13px",
  cursor: "pointer",
  flex: 1,
};

const viewBtn: React.CSSProperties = {
  background: "transparent",
  color: "#0f0",
  border: "1px solid #0f0",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: "13px",
  cursor: "pointer",
};

const pdfBtn: React.CSSProperties = {
  ...viewBtn,
  background: "#0f0",
  color: "#000",
};
