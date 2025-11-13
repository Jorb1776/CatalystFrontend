import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const MaterialForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');

  useEffect(() => {
if (isEdit && id) {
    axios.get<{ additiveID: number; name: string; pricePerPound: number; letDownRatio: number }>(`/api/additives/${id}`)
      .then(r => setName(r.data.name))
      .catch(() => {
        toast.error('Load failed');
        navigate('/additives');
      });
  }
  }, [id, isEdit, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      isEdit ? await axios.put(`/api/additives/${id}`, { additiveID: +id, name }) : await axios.post('/api/additives', { name });
      toast.success('Saved');
      onSuccess();
    } catch { toast.error('Failed'); }
  };

  return (
    <form onSubmit={submit} style={formStyle}>
      <h2 style={{ color: '#0f0' }}>{isEdit ? 'Edit' : 'New'} Additive</h2>
      <div style={grid}>
        <div style={field}>
          <label style={label}>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required style={input} />
        </div>
      </div>
      <div style={btnRow}>
        <button type="submit" style={btnGreen}>Save</button>
        <button type="button" onClick={() => navigate('/additives')} style={btnGray}>Cancel</button>
      </div>
    </form>
  );
};

const formStyle: React.CSSProperties = { maxWidth: 600, margin: '20px auto', padding: 24, background: '#111', border: '1px solid #333', borderRadius: 12 };
const grid: React.CSSProperties = { display: 'grid', gap: 16 };
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const label: React.CSSProperties = { color: '#0f0', marginBottom: 6 };
const input: React.CSSProperties = { padding: 10, background: '#222', border: '1px solid #444', borderRadius: 6, color: '#fff' };
const btnRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 };
const btnGreen: React.CSSProperties = { background: '#0f0', color: '#000', padding: '10px 20px', border: 'none', borderRadius: 6, fontWeight: 'bold' };
const btnGray: React.CSSProperties = { ...btnGreen, background: '#444', color: '#fff' };

export default MaterialForm;