// src/components/WorkOrderForm.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Product { productID: number; name: string }

const WorkOrderForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    poNumber: '',
    partNumber: '',
    priority: 3,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    workNote: '',
    dueDate: ''
  });

  useEffect(() => {
    axios.get('/api/products')
      .then((res: any) => setProducts(res.data));

    if (id) {
      axios.get(`/api/workorder/${id}`)
        .then((res: any) => {
          const wo = res.data;
          setForm({
            poNumber: wo.poNumber || '',
            partNumber: wo.partNumber || '',
            priority: wo.priority || 3,
            customerName: wo.customerName || '',
            customerEmail: wo.customerEmail || '',
            customerPhone: wo.customerPhone || '',
            quantity: wo.quantity || 1,
            workNote: wo.workNote || '',
            dueDate: wo.dueDate ? wo.dueDate.split('T')[0] : ''
          });
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`/api/workorder/${id}`, form);
      } else {
        await axios.post('/api/workorder', form);
      }
      navigate('/floor');
    } catch (err: any) {
      alert(`Save failed: ${err.response?.data?.title || 'Bad Request'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: 'auto', padding: 20, background: '#111', borderRadius: 8 }}>
      <h2 style={{ color: '#0f0', textAlign: 'center' }}>{id ? 'Edit' : 'New'} Work Order</h2>

      <input
        placeholder="PO Number"
        value={form.poNumber}
        onChange={e => setForm({ ...form, poNumber: e.target.value })}
        style={inputStyle}
        required
      />

      <select
        value={form.partNumber}
        onChange={e => setForm({ ...form, partNumber: e.target.value })}
        style={inputStyle}
        required
      >
        <option value="">Select Part</option>
        {products.map(p => (
          <option key={p.productID} value={p.name}>{p.name}</option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Quantity"
        value={form.quantity}
        onChange={e => setForm({ ...form, quantity: +e.target.value })}
        style={inputStyle}
        min="1"
        required
      />

      <input
        placeholder="Customer Name"
        value={form.customerName}
        onChange={e => setForm({ ...form, customerName: e.target.value })}
        style={inputStyle}
        required
      />

      <input
        placeholder="Customer Email"
        value={form.customerEmail}
        onChange={e => setForm({ ...form, customerEmail: e.target.value })}
        style={inputStyle}
      />

      <input
        placeholder="Customer Phone"
        value={form.customerPhone}
        onChange={e => setForm({ ...form, customerPhone: e.target.value })}
        style={inputStyle}
      />

      <input
        type="date"
        value={form.dueDate}
        onChange={e => setForm({ ...form, dueDate: e.target.value })}
        style={inputStyle}
      />

      <textarea
        placeholder="Work Note"
        value={form.workNote}
        onChange={e => setForm({ ...form, workNote: e.target.value })}
        style={{ ...inputStyle, height: 80, resize: 'vertical' }}
      />

      <div style={{ margin: '12px 0' }}>
        <label style={{ color: '#aaa', fontSize: '0.9em' }}>Priority: </label>
        <select
          value={form.priority}
          onChange={e => setForm({ ...form, priority: +e.target.value })}
          style={inputStyle}
        >
          <option value={1}>High (1)</option>
          <option value={3}>Medium (3)</option>
          <option value={5}>Low (5)</option>
        </select>
      </div>

      <button type="submit" style={btnStyle}>
        Save Work Order
      </button>
    </form>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  margin: '8px 0',
  background: '#222',
  border: '1px solid #0f0',
  borderRadius: 4,
  color: '#fff',
  fontSize: '1em'
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#0f0',
  color: '#000',
  border: 'none',
  borderRadius: 4,
  fontWeight: 'bold',
  fontSize: '1.1em',
  cursor: 'pointer',
  marginTop: 16
};

export default WorkOrderForm;