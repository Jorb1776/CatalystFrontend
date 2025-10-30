// src/components/BomList.js
import { useState } from 'react';
import axios from 'axios';
import BomItemList from './BomItemList';

export default function BomList({ boms, loading, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null);
  const [items, setItems] = useState({});
  const [itemLoading, setItemLoading] = useState({});

  const toggleItems = (bomid) => {
    if (expanded === bomid) {
      setExpanded(null);
    } else {
      setExpanded(bomid);
      if (!items[bomid]) {
        setItemLoading(prev => ({ ...prev, [bomid]: true }));
        axios.get(`https://localhost:7280/api/BOMs/${bomid}/items`)
          .then(res => setItems(prev => ({ ...prev, [bomid]: res.data })))
          .finally(() => setItemLoading(prev => ({ ...prev, [bomid]: false })));
      }
    }
  };

  return loading ? <p>Loading BOMs...</p> : boms.length === 0 ? <p>No BOMs found.</p> : (
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
  <>
    <tr key={b.bomid} style={trStyle}>
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
        <button onClick={() => onDelete(b.bomid)} style={delBtn}>Delete</button>
      </td>
    </tr>
    {expanded === b.bomid && (
      <tr>
        <td colSpan="5" style={{ padding: 0, border: 'none' }}>
          <div style={{ margin: '10px 20px' }}>
            <BomItemList items={items[b.bomid] || []} loading={itemLoading[b.bomid]} />
          </div>
        </td>
      </tr>
    )}
  </>
))}
      </tbody>
    </table>
  );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
const thStyle = { border: '1px solid #ccc', padding: 8, background: '#f0f0f0', textAlign: 'left' };
const trStyle = { border: '1px solid #ddd' };
const tdStyle = { padding: 8, border: '1px solid #ddd' };
const actionBtn = { margin: '0 4px', padding: '4px 8px', fontSize: '12px' };
const delBtn = { ...actionBtn, background: '#fcc', border: '1px solid #f99' };
const toggleBtn = { padding: '4px 8px', fontSize: '12px' };