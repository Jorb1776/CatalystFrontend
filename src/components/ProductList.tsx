// src/components/ProductList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { Product } from '../types/Product';
import toast from 'react-hot-toast';

interface ProductListProps {
  products: Product[];
  onDelete?: () => void;
  refreshProducts: () => void;
}


const ProductList: React.FC<ProductListProps> = ({ products, onDelete, refreshProducts }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterColor, setFilterColor] = useState('');

  
 const materials = Array.from(new Set(products.map(p => p.material?.name).filter(Boolean)));
  const colors = Array.from(new Set(products.map(p => p.colorant?.name).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.partName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesMaterial = !filterMaterial || p.material?.name === filterMaterial;
    const matchesColor = !filterColor || p.colorant?.name === filterColor;

    return matchesSearch && matchesMaterial && matchesColor;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete product?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success('Product deleted');
      onDelete?.();
      refreshProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#0f0', marginBottom: 16 }}>Products</h2>

      <div style={filterBar}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInput}
        />
        <select
          value={filterMaterial}
          onChange={e => setFilterMaterial(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Materials</option>
          {materials.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterColor}
          onChange={e => setFilterColor(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Colors</option>
          {colors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => navigate('/products/new')} style={newBtn}>New Product</button>
      </div>

      <div style={grid}>
        {filteredProducts.map(p => (
          <div key={p.productID} style={card}>
            <h3 style={{ color: '#0f0', marginBottom: 8 }}>{p.partName}</h3>
            <p><strong>Part:</strong> {p.partNumber}</p>
            <p><strong>Material:</strong> {p.material?.name || 'None'}</p>
            <p><strong>Color:</strong> {p.colorant?.name || 'None'}</p>
            <p><strong>Mold:</strong> {p.mold?.name || 'None'}</p>
            <p><strong>Full Box Qty:</strong> {p.fullBoxQty || '0'}</p>
            <p><strong>Box Size:</strong> {p.boxSize || '—'}</p>
            <p><strong>Bin ID:</strong> {p.binId || '—'}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => navigate(`/products/${p.productID}`)} style={detailsBtn}>
                Details
              </button>

              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:5099'}/api/products/${p.productID}/pdf`}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={pdfBtn}
                onClick={(e) => e.stopPropagation()}
              >
                PDF
              </a>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;

// Styles remain the same

const filterBar: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 20,
  flexWrap: 'wrap',
  alignItems: 'center'
};

const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: '10px 12px',
  background: '#222',
  border: '1px solid #444',
  borderRadius: 8,
  color: '#fff',
  fontSize: '15px'
};

const filterSelect: React.CSSProperties = {
  padding: '10px 12px',
  background: '#222',
  border: '1px solid #0f0',
  borderRadius: 8,
  color: '#0f0',
  fontSize: '14px',
  minWidth: 140
};

const newBtn: React.CSSProperties = {
  padding: '10px 16px',
  background: '#0f0',
  color: '#000',
  border: 'none',
  borderRadius: 8,
  fontWeight: 'bold',
  cursor: 'pointer'
};

const grid: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
};

const card: React.CSSProperties = {
  background: '#222',
  padding: 16,
  borderRadius: 12,
  color: '#fff',
  border: '1px solid #333',
  transition: 'transform 0.2s',
  cursor: 'default'
};

const detailsBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#0f0',
  border: '1px solid #0f0',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: '13px',
  cursor: 'pointer'
};

const deleteBtn: React.CSSProperties = {
  background: '#d33',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: '13px',
  cursor: 'pointer'
};

const viewBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#0f0',
  border: '1px solid #0f0',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: '13px',
  cursor: 'pointer'
};

const pdfBtn: React.CSSProperties = {
  ...viewBtn,
  background: '#0f0',
  color: '#000',
};