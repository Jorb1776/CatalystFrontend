// src/pages/MoldList.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';

interface Mold {
  moldID: number;
  baseNumber: string;
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
    m.baseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#0f0', margin: 0 }}>Molds</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search molds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 14px',
              background: '#111',
              color: '#0f0',
              border: '1px solid #0f0',
              borderRadius: 8,
              width: 280,
              fontSize: '1rem'
            }}
          />
          <Link to="/molds/new">
            <button style={{ background: '#0f0', color: '#000', padding: '10px 20px', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
              + New Mold
            </button>
          </Link>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #0f0' }}>
            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f0' }}>Mold Number</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f0' }}>Cavities</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#0f0' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMolds.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>
                {search ? 'No molds found' : 'No molds yet'}
              </td>
            </tr>
          ) : (
            filteredMolds.map(m => (
              <tr key={m.moldID} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '16px 8px', fontSize: '1.1rem' }}>{m.baseNumber}</td>
                <td style={{ padding: '16px 8px', color: '#0f0' }}>{m.cavityCount}</td>
                <td style={{ padding: '16px 8px' }}>
                  <Link to={`/molds/${m.moldID}`} style={{ color: '#0f0', marginRight: 16 }}>Edit</Link>
                  <Link to={`/molds/${m.moldID}/tool-pictures`} style={{ color: '#0c0', marginRight: 16 }}>
                    Tool Photos
                  </Link>
                  <button
                    onClick={() => deleteMold(m.moldID)}
                    style={{ color: '#f44', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
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