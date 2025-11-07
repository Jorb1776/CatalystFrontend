// src/pages/MoldList.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';

interface Mold {
  moldID: number;
  name: string;
  cavityCount: number;
  materialCompatibility: string;
  maintenanceSchedule: string;
}

const MoldList = () => {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [search, setSearch] = useState('');

  const loadMolds = async () => {
    try {
      const res = await axios.get<Mold[]>('/api/Molds');
      setMolds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMold = async (id: number) => {
    if (!confirm('Delete this mold?')) return;
    try {
      await axios.delete(`/api/Molds/${id}`);
      loadMolds();
    } catch {
      alert('Delete failed');
    }
  };

  useEffect(() => {
    loadMolds();
  }, []);

  const filteredMolds = molds.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Molds</h2>
        <input
          type="text"
          placeholder="Search molds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#222',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: 4,
            width: 240
          }}
        />
        <Link to="/molds/new">
          <button style={{ background: '#0c0', color: '#000', padding: '8px 16px', border: 'none' }}>
            + New Mold
          </button>
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #0f0' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Mold Number</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMolds.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ padding: 16, textAlign: 'center', color: '#aaa' }}>
                {search ? 'No molds found' : 'Loading...'}
              </td>
            </tr>
          ) : (
            filteredMolds.map(m => (
              <tr key={m.moldID} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: 8 }}>{m.name}</td>
                <td style={{ padding: 8 }}>
                  <Link to={`/molds/${m.moldID}`} style={{ color: '#0c0', marginRight: 8 }}>Edit</Link>
                  <button onClick={() => deleteMold(m.moldID)} style={{ color: '#d33', background: 'none', border: 'none' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MoldList;