// src/pages/ProductNew.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

interface ProductNewProps {
  refreshProducts: () => void;
}

export default function ProductNew({ refreshProducts }: ProductNewProps) {
  const navigate = useNavigate();

  const handleSuccess = async () => {
    await refreshProducts();
    navigate('/products');
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={backBtn}>Back</button>
      <h2 style={{ color: '#0f0', margin: '16px 0' }}>New Product</h2>
        <ProductForm
        onSuccess={handleSuccess}
        onCancel={() => navigate('/products')}
        />
    </div>
  );
}

const backBtn: React.CSSProperties = { background: 'transparent', color: '#0f0', border: '1px solid #0f0', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' };