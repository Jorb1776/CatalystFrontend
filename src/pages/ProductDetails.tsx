// src/pages/ProductDetails.tsx - Fixed
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import { Product } from '../types/Product';
import toast from 'react-hot-toast';


export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDownloadPDF = () => {
  if (!id) return;
  window.location.href = `/api/products/${id}/pdf`;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
    .get<Product>(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error('Failed to load product'))
      .then(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={styles.loading}>Loading product...</div>;
  }

  if (!product) {
    return <div style={styles.error}>Product not found</div>;
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        Back
      </button>

      <header style={styles.header}>
        <h1 style={styles.title}>{product.partNumber}</h1>
        <p style={styles.partNumber}>Part: {product.partName}</p>
      </header>

      <section style={styles.detailsCard}>
        <div style={styles.row}>
          <Detail label="Mold" value={product.mold?.name || '—'} />
          <Detail label="Box Size" value={product.boxSize || '—'} />
        </div>
        <div style={styles.row}>
          <Detail label="Material" value={product.material?.name || '—'} />
          <Detail label="Full Box Qty" value={(product.fullBoxQty ?? 0).toString()} />
        </div>
        <div style={styles.row}>
          <Detail label="Color" value={product.colorant?.name || '—'} />
          <Detail label="Bin ID" value={product.binId || '—'} />
        </div>
        {/* <div style={styles.row}>
          <Detail label="Unit Price" value={`$${product.unitPrice.toFixed(2)}`} fullWidth />
        </div>
        <div style={styles.row}>
          <Detail label="Description" value={product.description || '—'} fullWidth />
        </div> */}
      </section>

      <div style={styles.actions}>
        <button onClick={() => navigate(`/products/${id}/edit`)} style={styles.editBtn}>
          Edit Product
        </button>
      </div>
    </div>
  );
}

// Reusable detail row
const Detail: React.FC<{
  label: string;
  value: string;
  fullWidth?: boolean;
}> = ({ label, value, fullWidth }) => (
  <div style={{ ...styles.detail, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
    <strong style={styles.label}>{label}:</strong>
    <span style={styles.value}>{value}</span>
  </div>
);

// Clean, professional styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    color: '#aaa',
    textAlign: 'center',
    padding: 40,
    fontSize: '1.1rem',
  },
  error: {
    color: '#fcc',
    textAlign: 'center',
    padding: 40,
    fontSize: '1.1rem',
  },
  backBtn: {
    background: 'transparent',
    color: '#0f0',
    border: '1px solid #0f0',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
    borderBottom: '1px solid #333',
    paddingBottom: 16,
  },
  title: {
    color: '#0f0',
    margin: '0 0 8px',
    fontSize: '2rem',
    fontWeight: 600,
  },
  partNumber: {
    color: '#aaa',
    margin: 0,
    fontSize: '1.1rem',
  },
  detailsCard: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
grid: {
    display: 'grid',
    gridAutoFlow: 'row',          
    gridTemplateColumns: '1fr 1fr', 
    gap: 16,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 16,
  },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    color: '#0f0',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    color: '#fff',
    fontSize: '1.05rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  editBtn: {
    background: '#0f0',
    color: '#000',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
};