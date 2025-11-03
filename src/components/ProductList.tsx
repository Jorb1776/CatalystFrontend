// src/components/ProductList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { Product } from '../types/Product';
import toast from 'react-hot-toast';

interface ProductListProps {
  products: Product[];
  onDelete?: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onDelete }) => {
  const navigate = useNavigate();



const handleDelete = async (id: number) => {
  if (!window.confirm('Delete product?')) return;
  try {
    await axios.delete(`/api/products/${id}`);
    toast.success('Product deleted');
    onDelete?.();
  } catch (err: any) {
    toast.error('Delete failed');
  }
};

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#0f0' }}>Products</h2>
      <button onClick={() => navigate('/products/new')} style={{ background: '#0f0', color: '#000', padding: '8px 16px', marginBottom: 16 }}>
        + New Product
      </button>
      <div style={{ display: 'grid', gap: 12 }}>
        {products.map(p => (
          <div key={p.productID} style={{ background: '#222', padding: 12, borderRadius: 8, color: '#fff' }}>
            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
            <div style={{ fontSize: '0.9em', color: '#aaa' }}>{p.partNumber}</div>
            {p.description && <div style={{ fontSize: '0.85em', marginTop: 4 }}>{p.description}</div>}
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigate(`/products/${p.productID}`)} style={{ background: 'transparent', color: '#0f0', border: '1px solid #0f0', padding: '4px 8px' }}>
                Edit
              </button>
              <button 
                onClick={() => handleDelete(p.productID)}
                style={{ marginLeft: 8, background: '#d33', color: '#fff', border: 'none', padding: '4px 8px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;