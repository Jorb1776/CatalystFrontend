import { useState, useEffect } from 'react';
import axios from 'axios';
import ScheduleCalendar from './ScheduleCalendar';

export default function Reporting() {
  const [metrics, setMetrics] = useState({ production: 0, inventory: 0, defects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/reports/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMetrics(res.data))
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading reports...</p>;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Reporting Dashboard</h2>
      <div style={{ marginBottom: 30 }}>
        <table style={tableStyle}>
          <tbody>
            <tr><td>Production Orders Completed:</td><td>{metrics.production}</td></tr>
            <tr><td>Total Inventory Value:</td><td>${metrics.inventory}</td></tr>
            <tr><td>Defect Rate:</td><td>{metrics.defects}%</td></tr>
          </tbody>
        </table>
      </div>
      <h3>Production Schedule</h3>
      <ScheduleCalendar />
    </div>
  );
}

const tableStyle = { borderCollapse: 'collapse', width: '50%', border: '1px solid #ccc' };