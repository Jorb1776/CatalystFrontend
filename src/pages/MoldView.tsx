// src/pages/MoldView.tsx
import React, { useState, useEffect } from "react";
import axios from "../axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

interface Mold {
  moldID: number;
  baseNumber: string;
  materialCompatibility: string;
  maintenanceSchedule: string;
  shelfLocation: string;
  physicalLocation: string;
}

interface MoldProduct {
  productID: number;
  partNumber: string;
  partName: string;
  description: string;
  insertCode: string;
  colorCode: string;
}

const MoldView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mold, setMold] = useState<Mold | null>(null);
  const [products, setProducts] = useState<MoldProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMold();
      loadProducts();
    }
  }, [id]);

  const loadMold = async () => {
    try {
      const res = await axios.get<Mold>(`/api/molds/${id}`);
      setMold(res.data);
    } catch {
      toast.error("Failed to load mold");
      navigate("/molds");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get<MoldProduct[]>(`/api/molds/${id}/products`);
      setProducts(res.data);
    } catch {
      setProducts([]);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#aaa" }}>Loading...</p>
      </div>
    );
  }

  if (!mold) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#fcc" }}>Mold not found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate("/molds")} style={styles.backBtn}>
        ← Back to Molds
      </button>

      {/* Mold Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{mold.baseNumber}</h1>
        <div style={styles.locationBadge}>
          {mold.physicalLocation || "IN"}
        </div>
      </div>

      {/* Mold Details */}
      <div style={styles.detailsGrid}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Shelf Location</span>
          <span style={styles.detailValue}>{mold.shelfLocation || "—"}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Physical Location</span>
          <span style={styles.detailValue}>{mold.physicalLocation || "IN"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <Link to={`/molds/${id}`}>
          <button style={styles.editBtn}>Edit Mold</button>
        </Link>
        <Link to={`/molds/${id}/tool-pictures`}>
          <button style={styles.actionBtn}>Tool Photos</button>
        </Link>
        <Link to={`/molds/${id}/tool-pictures/upload`}>
          <button style={styles.actionBtnOutline}>Upload Photos</button>
        </Link>
      </div>

      {/* Associated Parts Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Associated Parts ({products.length})
        </h2>

        {products.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No parts are assigned to this mold yet.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Part Number</th>
                  <th style={styles.th}>Part Name</th>
                  <th style={styles.th}>Insert</th>
                  <th style={styles.th}>Color</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.productID} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.partNumber}>{p.partNumber}</span>
                    </td>
                    <td style={styles.td}>{p.partName}</td>
                    <td style={styles.td}>
                      <span style={styles.code}>{p.insertCode || "—"}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.code}>{p.colorCode || "—"}</span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/products/${p.productID}`}>
                        <button style={styles.viewBtn}>View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 20px",
  },
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 24,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    color: "#0f0",
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: 0,
  },
  locationBadge: {
    background: "#0f0",
    color: "#000",
    padding: "6px 16px",
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
    background: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #333",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  detailLabel: {
    color: "#888",
    fontSize: "0.85rem",
  },
  detailValue: {
    color: "#fff",
    fontSize: "1.1rem",
    fontWeight: 500,
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 32,
  },
  editBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
  },
  actionBtn: {
    background: "#0f0",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  actionBtnOutline: {
    background: "transparent",
    color: "#0f0",
    border: "2px solid #0f0",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    color: "#0f0",
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: 16,
  },
  emptyState: {
    background: "#1a1a1a",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    color: "#888",
    border: "1px solid #333",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: 12,
    border: "1px solid #333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#1a1a1a",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#222",
    color: "#0f0",
    fontWeight: 600,
    fontSize: "0.9rem",
    borderBottom: "1px solid #333",
  },
  tr: {
    borderBottom: "1px solid #333",
  },
  td: {
    padding: "12px 16px",
    color: "#fff",
    fontSize: "0.95rem",
  },
  partNumber: {
    color: "#0f0",
    fontWeight: 600,
  },
  code: {
    background: "#333",
    padding: "4px 8px",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: "0.85rem",
  },
  viewBtn: {
    background: "transparent",
    color: "#0af",
    border: "1px solid #0af",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};

export default MoldView;
