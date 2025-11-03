// src/components/Reporting.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import ScheduleCalendar from './ScheduleCalendar';

interface Metrics {
  production: number;
  inventory: number;
  defects: number;
}

export default function Reporting() {
  const [metrics, setMetrics] = useState<Metrics>({ production: 0, inventory: 0, defects: 0 });
  const [loading, setLoading] = useState(true);

const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/reports/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res: any) => {
        setMetrics({
          production: res.data.production,
          inventory: parseFloat(res.data.inventory),
          defects: parseFloat(res.data.defects)
        });
      })
      .catch((err: any) => console.error(err))  // ← typed
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading reports...</p>;
if (error) return <p style={{ color: '#f00' }}>Error: {error}</p>;

  return (
    <div style={{ marginTop: 20, padding: 20 }}>
      <h2 style={{ color: '#0f0' }}>Reporting Dashboard</h2>
      <div style={{ marginBottom: 30 }}>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td>Production Orders Completed:</td>
              <td>{metrics.production}</td>
            </tr>
            <tr>
              <td>Total Inventory Value:</td>
              <td>${metrics.inventory.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Defect Rate:</td>
              <td>{metrics.defects}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Production Schedule</h3>
      <ScheduleCalendar />
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  background: '#111',
  color: '#0f0',
  fontFamily: 'monospace',
  border: '1px solid #0f0'
};