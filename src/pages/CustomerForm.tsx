import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Customer {
  customerID: number;
  name: string;
  address: string;
  creditLimit: number;
  email1?: string;
  email2?: string;
  email3?: string;
  sendOrderConfirmations: boolean;
}

const CustomerForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(0);
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [email3, setEmail3] = useState('');
  const [sendOrderConfirmations, setSendOrderConfirmations] = useState(true);

  useEffect(() => {
    if (isEdit && id) {
      axios.get<Customer>(`/api/customers/${id}`)
        .then(r => {
          setName(r.data.name);
          setAddress(r.data.address || '');
          setCreditLimit(r.data.creditLimit || 0);
          setEmail1(r.data.email1 || '');
          setEmail2(r.data.email2 || '');
          setEmail3(r.data.email3 || '');
          setSendOrderConfirmations(r.data.sendOrderConfirmations ?? true);
        })
        .catch(() => {
          toast.error('Failed to load customer');
          navigate('/customers');
        });
    }
  }, [id, isEdit, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      Name: name,
      Address: address,
      CreditLimit: creditLimit,
      Email1: email1 || null,
      Email2: email2 || null,
      Email3: email3 || null,
      SendOrderConfirmations: sendOrderConfirmations,
    };

    try {
      if (isEdit) {
        await axios.put(`/api/customers/${id}`, payload);
      } else {
        await axios.post('/api/customers', payload);
      }
      toast.success('Customer saved');
      navigate('/customers');
    } catch {
      toast.error('Failed to save customer');
    }
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <form onSubmit={submit} style={formStyle}>
      <h2 style={{ color: '#0f0', marginBottom: 24 }}>{isEdit ? 'Edit' : 'New'} Customer</h2>

      <div style={section}>
        <h3 style={sectionTitle}>Basic Information</h3>
        <div style={grid}>
          <div style={field}>
            <label style={label}>Customer Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={input}
              placeholder="Enter customer name"
            />
          </div>
          <div style={field}>
            <label style={label}>Address</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={input}
              placeholder="Enter address"
            />
          </div>
          <div style={field}>
            <label style={label}>Credit Limit</label>
            <input
              type="number"
              value={creditLimit}
              onChange={e => setCreditLimit(+e.target.value)}
              style={input}
              min={0}
              step={0.01}
            />
          </div>
        </div>
      </div>

      <div style={section}>
        <h3 style={sectionTitle}>Email Addresses</h3>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
          These emails will receive notifications when work orders are completed for this customer.
        </p>
        <div style={grid}>
          <div style={field}>
            <label style={label}>Primary Email</label>
            <input
              type="email"
              value={email1}
              onChange={e => setEmail1(e.target.value)}
              style={{
                ...input,
                borderColor: validateEmail(email1) ? '#444' : '#f66'
              }}
              placeholder="primary@example.com"
            />
          </div>
          <div style={field}>
            <label style={label}>Secondary Email</label>
            <input
              type="email"
              value={email2}
              onChange={e => setEmail2(e.target.value)}
              style={{
                ...input,
                borderColor: validateEmail(email2) ? '#444' : '#f66'
              }}
              placeholder="secondary@example.com"
            />
          </div>
          <div style={field}>
            <label style={label}>Tertiary Email</label>
            <input
              type="email"
              value={email3}
              onChange={e => setEmail3(e.target.value)}
              style={{
                ...input,
                borderColor: validateEmail(email3) ? '#444' : '#f66'
              }}
              placeholder="tertiary@example.com"
            />
          </div>
        </div>
      </div>

      <div style={section}>
        <h3 style={sectionTitle}>Notification Settings</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            id="sendConfirmations"
            checked={sendOrderConfirmations}
            onChange={e => setSendOrderConfirmations(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: '#0f0' }}
          />
          <label htmlFor="sendConfirmations" style={{ color: '#fff', cursor: 'pointer' }}>
            Send order confirmation emails when work orders are created
          </label>
        </div>
        <p style={{ color: '#888', fontSize: 13, marginTop: 8, marginLeft: 32 }}>
          When enabled, the customer will receive an email confirmation each time a new work order is created for them.
        </p>
      </div>

      <div style={btnRow}>
        <button type="submit" style={btnGreen}>Save Customer</button>
        <button type="button" onClick={() => navigate('/customers')} style={btnGray}>Cancel</button>
      </div>
    </form>
  );
};

const formStyle: React.CSSProperties = { maxWidth: 700, margin: '20px auto', padding: 24, background: '#111', border: '1px solid #333', borderRadius: 12 };
const section: React.CSSProperties = { marginBottom: 32 };
const sectionTitle: React.CSSProperties = { color: '#0f0', fontSize: 16, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 };
const grid: React.CSSProperties = { display: 'grid', gap: 16 };
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const label: React.CSSProperties = { color: '#0f0', marginBottom: 6, fontSize: 14 };
const input: React.CSSProperties = { padding: 10, background: '#222', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: 14 };
const btnRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 };
const btnGreen: React.CSSProperties = { background: '#0f0', color: '#000', padding: '10px 20px', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' };
const btnGray: React.CSSProperties = { ...btnGreen, background: '#444', color: '#fff' };

export default CustomerForm;
