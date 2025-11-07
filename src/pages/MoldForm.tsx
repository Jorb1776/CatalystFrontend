// src/pages/MoldForm.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Mold {
  moldID: number;
  name: string;
  cavityCount: number;
  materialCompatibility: string;
  maintenanceSchedule: string;
}

const MoldForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    cavityCount: 1,
    materialCompatibility: '',
    maintenanceSchedule: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (isEdit && id) {
      axios.get<Mold>(`/api/Molds/${id}`)
        .then(res => {
          const m = res.data;
          setFormData({
            name: m.name,
            cavityCount: m.cavityCount,
            materialCompatibility: m.materialCompatibility || '',
            maintenanceSchedule: new Date(m.maintenanceSchedule).toISOString().slice(0, 16),
          });
        })
        .catch(() => {
          toast.error('Failed to load mold');
          navigate('/molds');
        });
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cavityCount' ? +value : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && id) {
        await axios.put(`/api/Molds/${id}`, { moldID: +id, ...formData });
        toast.success('Mold updated');
      } else {
        await axios.post('/api/Molds', formData);
        toast.success('Mold created');
      }
      onSuccess();
    } catch {
      toast.error('Save failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ margin: '0 0 20px', color: '#0f0' }}>{isEdit ? 'Edit' : 'New'} Mold</h2>

      <div style={gridContainer}>
        <div style={field}>
          <label style={labelStyle}>Mold Number *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. MLD-001"
            required
            style={inputStyle}
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>Cavity Count *</label>
          <input
            name="cavityCount"
            type="number"
            min="1"
            value={formData.cavityCount}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* <div style={field}>
          <label style={labelStyle}>Material Compatibility</label>
          <input
            name="materialCompatibility"
            value={formData.materialCompatibility}
            onChange={handleChange}
            placeholder="e.g. PP, ABS, PC"
            style={inputStyle}
          />
        </div> */}

        {/* <div style={field}>
          <label style={labelStyle}>Next Maintenance *</label>
          <input
            name="maintenanceSchedule"
            type="datetime-local"
            value={formData.maintenanceSchedule}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div> */}
      </div>

      <div style={buttonRow}>
        <button type="submit" style={btnStyle}>
          {isEdit ? 'Update' : 'Create'} Mold
        </button>
        <button type="button" onClick={() => navigate('/molds')} style={cancelBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
};

// Styles (mirroring ProductForm)
const formStyle: React.CSSProperties = {
  margin: '20px auto',
  maxWidth: 800,
  padding: 28,
  border: '1px solid #333',
  borderRadius: 12,
  background: '#111',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif'
};

const gridContainer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  marginBottom: 24
};

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: '14px',
  fontWeight: 500,
  color: '#0f0'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#222',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#fff',
  fontSize: '14px'
};

const buttonRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 12
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#0f0',
  color: '#000',
  border: 'none',
  borderRadius: 6,
  fontWeight: 'bold',
  cursor: 'pointer'
};

const cancelBtn: React.CSSProperties = {
  ...btnStyle,
  background: '#444',
  color: '#fff'
};

export default MoldForm;