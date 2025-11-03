// src/components/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';

interface Product {
  productID?: number;
  name?: string;
  unitPrice?: number;
  description?: string;
}

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [form, setForm] = useState({ name: '', unitPrice: '', description: '' });

  
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        unitPrice: product.unitPrice?.toString() || '',
        description: product.description || ''
      });
    }
  }, [product]);



const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const payload = {
    name: form.name,
    unitPrice: parseFloat(form.unitPrice),
    description: form.description,
    materialRequirements: '[]'
  };

  const request = product
    ? axios.put(`/api/Products/${product.productID}`, payload)
    : axios.post('/api/Products', payload);

  request
    .then(() => {
      setForm({ name: '', unitPrice: '', description: '' });
      toast.success(product ? 'Product updated!' : 'Product created!');
      onSuccess();
    })
    .catch((err: any) => {
      toast.error('Save failed');
      console.error(err);
    });
};

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={inputStyle} />
      <input type="number" step="0.01" placeholder="Unit Price" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} required style={inputStyle} />
      <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} />
      <button type="submit" style={btnStyle}>{product ? 'Update' : 'Save'}</button>
      <button type="button" onClick={onCancel} style={btnStyle}>Cancel</button>
    </form>
  );
}

const formStyle: React.CSSProperties = { margin: '20px 0', padding: 15, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle: React.CSSProperties = { display: 'block', margin: '10px 0', padding: 8, width: '100%', maxWidth: 400 };
const btnStyle: React.CSSProperties = { margin: '0 5px', padding: '8px 16px' };