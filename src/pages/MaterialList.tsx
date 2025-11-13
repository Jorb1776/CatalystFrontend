import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';
import { Material } from '../types/Inventory';

const MaterialList = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const res = await axios.get<Material[]>('/api/materials');
    setMaterials(res.data);
  };

  const del = async (id: number) => {
    if (!confirm('Delete material?')) return;
    await axios.delete(`/api/materials/${id}`);
    load();
  };

  useEffect(() => { load(); }, []);

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Materials</h2>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={searchStyle} />
        <Link to="/materials/new"><button style={btnSuccess}>+ New</button></Link>
      </div>
      <table style={tableStyle}>
        <thead><tr><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(m => (
            <tr key={m.materialID}>
              <td>{m.name}</td>
              <td>
                <Link to={`/materials/${m.materialID}`} style={linkGreen}>Edit</Link>
                <button onClick={() => del(m.materialID)} style={btnRed}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const searchStyle: React.CSSProperties = { padding: 8, background: '#222', color: '#0f0', border: '1px solid #0f0', borderRadius: 4, width: 200 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const btnSuccess: React.CSSProperties = { background: '#0c0', color: '#000', padding: '8px 16px', border: 'none', borderRadius: 4 };
const btnRed: React.CSSProperties = { background: 'none', border: 'none', color: '#d33', marginLeft: 8 };
const linkGreen: React.CSSProperties = { color: '#0c0', marginRight: 8 };

export default MaterialList;