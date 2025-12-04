// src/pages/ProductDetails.tsx
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
  const [hasQsi, setHasQsi] = useState<boolean | null>(null);
  const [fileExists, setFileExists] = useState<Record<string, boolean>>({
    '2d-cad': false,
    '3d-cad': false,
    'setup-sheet': false,
    'tool-pictures': false,
  });
  const [basePhotos, setBasePhotos] = useState<string[]>([]);
  const [insertPhotos, setInsertPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    axios.get<Product>(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load product');
        setLoading(false);
      });

    axios.get(`/api/qsi/product/${id}`)
      .then(() => setHasQsi(true))
      .catch(err => setHasQsi(err.response?.status === 404 ? false : null));

    // Check all file existence via HEAD requests
    const types = ['2d-cad', '3d-cad', 'setup-sheet', 'tool-pictures'];
    types.forEach(type => {
      axios.head(`/api/productfiles/${id}/${type}`)
        .then(() => setFileExists(prev => ({ ...prev, [type]: true })))
        .catch(() => setFileExists(prev => ({ ...prev, [type]: false })));
    });
  }, [id]);

  useEffect(() => {
    if (product?.moldInsert?.moldId) {
      // Load base photos
      axios.get<{ files: string[] }>(`/api/moldfiles/${product.moldInsert.moldId}/tool-pictures/base`)
        .then(res => setBasePhotos(res.data.files || []))
        .catch(() => setBasePhotos([]));

      // Load insert photos using the insertCode from moldInsert
      if (product.moldInsert.insertCode) {
        axios.get<{ files: string[] }>(`/api/moldfiles/${product.moldInsert.moldId}/tool-pictures/inserts/${product.moldInsert.insertCode}`)
          .then(res => setInsertPhotos(res.data.files || []))
          .catch(() => setInsertPhotos([]));
      }
    }
  }, [product]);

  const handleFileClick = (type: string) => {
    const token = localStorage.getItem('token') || '';
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/productfiles/${id}/${type}?token=${token}`;
    window.open(url, '_blank');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!product) return <div style={styles.error}>Product not found</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

      <div style={styles.header}>
        <h1 style={styles.title}>{product.partName}</h1>
        <p style={styles.partNumber}>Part #: {product.partNumber}</p>
      </div>

      <div style={styles.detailsCard}>
        <div style={styles.row}>
          <div style={styles.detail}>
            <span style={styles.label}>Description</span>
            <span style={styles.value}>{product.description || 'N/A'}</span>
          </div>
          <div style={styles.detail}>
            <span style={styles.label}>Material</span>
            <span style={styles.value}>{product.material?.name || 'N/A'}</span>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.detail}>
            <span style={styles.label}>Mold Number</span>
            <span style={styles.value}>
              {product.moldInsert?.fullNumber || 'N/A'}
            </span>
          </div>
          <div style={styles.detail}>
            <span style={styles.label}>Cavities</span>
            <span style={styles.value}>{product.cavities}</span>
          </div>
        </div>
        {/* ... other details ... */}
      </div>

      <div style={styles.engineeringSection}>
        <h2 style={styles.sectionTitle}>Engineering Files</h2>
        <div style={styles.engineeringGrid}>
          <button onClick={() => handleFileClick('2d-cad')} style={styles.engBtn}>
            2D CAD {fileExists['2d-cad'] ? '✅' : ''}
          </button>
          <button onClick={() => handleFileClick('3d-cad')} style={styles.engBtn}>
            3D CAD {fileExists['3d-cad'] ? '✅' : ''}
          </button>
          <button onClick={() => handleFileClick('setup-sheet')} style={styles.engBtn}>
            Setup Sheet {fileExists['setup-sheet'] ? '✅' : ''}
          </button>
          {/* Remove old tool-pictures button */}
        </div>
      </div>

      {/* New Tool Photos Section */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: '#0f0' }}>Base Mold Photos</h3>
        {basePhotos.length === 0 ? (
          <p style={{ color: '#aaa' }}>No base photos</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {basePhotos.map(file => (
              <img
                key={file}
                src={`/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/base/${file}`}
                alt={file}
                style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #333', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
              />
            ))}
          </div>
        )}

        <h3 style={{ color: '#0f0', marginTop: 40 }}>Insert Photos</h3>
        {insertPhotos.length === 0 ? (
          <p style={{ color: '#aaa' }}>No insert photos</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {insertPhotos.map(file => (
              <img
                key={file}
                src={`/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/inserts/${product?.moldInsert?.insertCode}/${file}`}
                alt={file}
                style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #333', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles (updated for type safety)
const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, sans-serif' } as const,
  loading: { textAlign: 'center' as const, padding: 40, color: '#aaa' },
  error: { textAlign: 'center' as const, padding: 40, color: '#fcc' },
  backBtn: { background: 'transparent', color: '#0f0', border: '1px solid #0f0', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', marginBottom: 16 },
  header: { marginBottom: 24, borderBottom: '1px solid #333', paddingBottom: 16 },
  title: { color: '#0f0', margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 600 },
  partNumber: { color: '#aaa', margin: 0 },
  detailsCard: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 20, marginBottom: 24 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  detail: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  label: { color: '#0f0', fontSize: '0.85rem', textTransform: 'uppercase' as const },
  value: { color: '#fff', fontSize: '1.05rem' },
  actions: { display: 'flex', alignItems: 'center', marginBottom: 32 },
  editBtn: { background: '#0f0', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  engineeringSection: { marginTop: 20 },
  sectionTitle: { color: '#0f0', fontSize: '1.5rem', marginBottom: 20, borderBottom: '1px solid #333', paddingBottom: 8 },
  engineeringGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  engBtn: {
    display: 'block',
    background: 'transparent',
    color: '#0f0',
    border: '1px solid #0f0',
    padding: '12px 16px',
    borderRadius: 8,
    textAlign: 'center' as const,
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
};