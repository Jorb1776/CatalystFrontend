// src/components/BomForm.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';

interface Product {
  productID: number;
  name: string;
}

interface BomItem {
  componentID: number;
  quantity: number;
}

interface Bom {
  bomID?: number;
  productID?: number;
  version?: string;
  items?: BomItem[];
}

interface BomFormProps {
  bom?: Bom;
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BomForm({ bom, products, onSuccess, onCancel }: BomFormProps) {
  const [form, setForm] = useState({ productID: '', version: '1.0', items: [] as BomItem[] });
  const [newItem, setNewItem] = useState({ componentID: '', quantity: '' });

  useEffect(() => {
    if (bom) {
      setForm({
        productID: bom.productID?.toString() || '',
        version: bom.version || '1.0',
        items: bom.items || []
      });
    }
  }, [bom]);

  const addItem = () => {
    if (newItem.componentID && newItem.quantity) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, { componentID: +newItem.componentID, quantity: parseFloat(newItem.quantity) }]
      }));
      setNewItem({ componentID: '', quantity: '' });
    }
  };

  const removeItem = (idx: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required');
      return;
    }

    if (!form.productID) {
      toast.error('Select a product');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Add at least one component');
      return;
    }

    const payload = {
      ProductID: +form.productID,
      Version: form.version,
      Items: form.items.map(i => ({
        ComponentID: i.componentID,
        ComponentName: "",
        Quantity: i.quantity
      }))
    };

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (bom?.bomID) {
        await axios.put(`/api/BOMs/${bom.bomID}`, payload, config);
        toast.success('BOM updated!');
      } else {
        await axios.post('/api/BOMs', payload, config);
        toast.success('BOM created!');
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.title || err.message;
      toast.error(`Save failed: ${msg}`);
      console.error('BOM Error:', err.response?.data);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <select
        value={form.productID}
        onChange={e => setForm({ ...form, productID: e.target.value })}
        required
        style={inputStyle}
      >
        <option value="">Select Product</option>
        {products.map(p => (
          <option key={p.productID} value={p.productID}>{p.name}</option>
        ))}
      </select>

      <input
        placeholder="Version"
        value={form.version}
        onChange={e => setForm({ ...form, version: e.target.value })}
        style={inputStyle}
      />

      <div style={{ margin: '20px 0', padding: '10px', border: '1px dashed #aaa', borderRadius: 6 }}>
        <h4>Add Component</h4>
        <select
          value={newItem.componentID}
          onChange={e => setNewItem({ ...newItem, componentID: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select Component</option>
          {products.map(p => (
            <option key={p.productID} value={p.productID}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
          style={{ ...inputStyle, display: 'inline-block', width: '100px', marginRight: 8 }}
        />
        <button type="button" onClick={addItem} style={btnStyle}>Add</button>
      </div>

      {form.items.length > 0 && (
        <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
          {form.items.map((item, i) => {
            const comp = products.find(p => p.productID === item.componentID);
            return (
              <li key={i}>
                {comp?.name || 'Unknown'} × {item.quantity}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{ marginLeft: 8, color: 'red', fontSize: '12px' }}
                >
                  Remove
                </button>
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

// Styles (MUST be after return)
const formStyle: React.CSSProperties = { margin: '20px 0', padding: 15, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle: React.CSSProperties = { display: 'block', margin: '10px 0', padding: 8, width: '100%', maxWidth: 400 };
const btnStyle: React.CSSProperties = { margin: '0 5px', padding: '6px 12px', fontSize: '14px' };