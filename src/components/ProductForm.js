// src/components/ProductForm.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductForm({ product, onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', unitPrice: '', description: '' });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        unitPrice: product.unitPrice || '',
        description: product.description || ''
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      unitPrice: parseFloat(form.unitPrice),
      description: form.description
    };

    const request = product
      ? axios.put(`https://localhost:7280/api/Products/${product.productID}`, payload)
      : axios.post('https://localhost:7280/api/Products', payload);

    request
      .then(() => {
        setForm({ name: '', unitPrice: '', description: '' });
        onSuccess();
      })
      .catch(err => console.error('Save failed:', err));
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

const formStyle = { margin: '20px 0', padding: 15, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle = { display: 'block', margin: '10px 0', padding: 8, width: '100%', maxWidth: 400 };
const btnStyle = { margin: '0 5px', padding: '8px 16px' };