// src/components/BomList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import BomItemList from './BomItemList';
import toast from 'react-hot-toast';

// MOVE OUTSIDE
const CreateBomButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/boms/new')}
      style={{
        background: '#0f0',
        color: '#000',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 4,
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      + New BOM
    </button>
  );
};

interface Bom {
  bomid: number;
  product?: { name: string };
  version?: string;
}

interface BomListProps {
  boms: Bom[];
  loading: boolean;
  onEdit: (b: Bom) => void;
  onDelete: (id: number) => void;
}

export default function BomList({ boms, loading, onEdit, onDelete }: BomListProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [items, setItems] = useState<Record<number, any>>({});
  const [itemLoading, setItemLoading] = useState<Record<number, boolean>>({});

  const toggleItems = (bomid: number) => {
    if (expanded === bomid) {
      setExpanded(null);
    } else {
      setExpanded(bomid);
      if (!items[bomid]) {
        setItemLoading(prev => ({ ...prev, [bomid]: true }));
        axios.get(`/api/BOMs/${bomid}/items`)
          .then((res: any) => setItems(prev => ({ ...prev, [bomid]: res.data })))
          .finally(() => setItemLoading(prev => ({ ...prev, [bomid]: false })))
          .catch(() => toast.error('Failed to load BOM items'));
      }
    }
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Delete BOM?')) return;
    axios.delete(`/api/BOMs/${id}`)
      .then(() => {
        toast.success('BOM deleted');
        onDelete(id);
      })
      .catch(() => toast.error('Delete failed'));
  };

  if (loading) return <p>Loading BOMs...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#0f0' }}>BOMs</h2>
        <CreateBomButton />
      </div>

      {boms.length === 0 ? (
        <p>No BOMs found. Click "New BOM" to create one.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={thStyle}>
              <th>BOM ID</th>
              <th>Product</th>
              <th>Version</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {boms.map(b => (
              <React.Fragment key={b.bomid}>
                <tr style={trStyle}>
                  <td style={tdStyle}>{b.bomid}</td>
                  <td style={tdStyle}>{b.product?.name || 'N/A'}</td>
                  <td style={tdStyle}>{b.version || '1.0'}</td>
                  <td style={tdStyle}>
                    <button onClick={() => toggleItems(b.bomid)} style={toggleBtn}>
                      {expanded === b.bomid ? 'Hide' : 'Show'} Items
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => onEdit(b)} style={actionBtn}>Edit</button>
                    <button onClick={() => handleDelete(b.bomid)} style={delBtn}>Delete</button>
                  </td>
                </tr>
                {expanded === b.bomid && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                      <div style={{ margin: '10px 20px' }}>
                        <BomItemList items={items[b.bomid] || []} loading={itemLoading[b.bomid]} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
const thStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 8, background: '#f0f0f0', textAlign: 'left' };
const trStyle: React.CSSProperties = { border: '1px solid #ddd' };
const tdStyle: React.CSSProperties = { padding: 8, border: '1px solid #ddd' };
const actionBtn: React.CSSProperties = { margin: '0 4px', padding: '4px 8px', fontSize: '12px' };
const delBtn: React.CSSProperties = { ...actionBtn, background: '#fcc', border: '1px solid #f99' };
const toggleBtn: React.CSSProperties = { padding: '4px 8px', fontSize: '12px' };