// src/components/BomForm.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BomForm({ bom, products, onSuccess, onCancel }) {
  const [form, setForm] = useState({ productID: '', version: '1.0', items: [] });
  const [newItem, setNewItem] = useState({ componentID: '', quantity: '' });

  useEffect(() => {
    if (bom) {
      setForm({
        productID: bom.productID || '',
        version: bom.version || '1.0',
        items: bom.items || []
      });
    }
  }, [bom]);

  const addItem = () => {
    if (newItem.componentID && newItem.quantity) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, { componentID: parseInt(newItem.componentID), quantity: parseFloat(newItem.quantity) }]
      }));
      setNewItem({ componentID: '', quantity: '' });
    }
  };

  const removeItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      productID: parseInt(form.productID),
      version: form.version,
      items: form.items
    };

    const request = bom
      ? axios.put(`https://localhost:7280/api/BOMs/${bom.bomID}`, payload)
      : axios.post('https://localhost:7280/api/BOMs', payload);

    request
      .then(() => onSuccess())
      .catch(err => console.error('BOM save failed:', err));
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <select value={form.productID} onChange={e => setForm({ ...form, productID: e.target.value })} required style={inputStyle}>
        <option value="">Select Product</option>
        {products.map(p => (
          <option key={p.productID} value={p.productID}>{p.name}</option>
        ))}
      </select>

      <input placeholder="Version" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} required style={inputStyle} />

      <div style={{ margin: '15px 0', padding: '10px', border: '1px dashed #aaa', borderRadius: 6 }}>
        <h4>Add Component</h4>
        <select value={newItem.componentID} onChange={e => setNewItem({ ...newItem, componentID: e.target.value })} style={inputStyle}>
          <option value="">Select Component</option>
          {products.map(p => (
            <option key={p.productID} value={p.productID}>{p.name}</option>
          ))}
        </select>
        <input type="number" step="0.01" placeholder="Quantity" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} style={{ ...inputStyle, display: 'inline-block', width: '100px', marginRight: 8 }} />
        <button type="button" onClick={addItem} style={btnStyle}>Add</button>
      </div>

      {form.items.length > 0 && (
        <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
          {form.items.map((item, i) => {
            const comp = products.find(p => p.productID === item.componentID);
            return (
              <li key={i}>
                {comp?.name || 'Unknown'} × {item.quantity}
                <button type="button" onClick={() => removeItem(i)} style={{ marginLeft: 8, color: 'red', fontSize: '12px' }}>Remove</button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="submit" style={btnStyle}>{bom ? 'Update' : 'Create BOM'}</button>
      <button type="button" onClick={onCancel} style={btnStyle}>Cancel</button>
    </form>
  );
}

const formStyle = { margin: '20px 0', padding: 15, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle = { display: 'block', margin: '10px 0', padding: 8, width: '100%', maxWidth: 400 };
const btnStyle = { margin: '0 5px', padding: '6px 12px', fontSize: '14px' };