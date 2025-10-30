import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FloorDashboard = ({ connection }) => {
  const [schedules, setSchedules] = useState([]);
  const [machines, setMachines] = useState([]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [schedRes, machRes] = await Promise.all([
        axios.get('/api/productionschedules', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/machines/status', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSchedules(schedRes.data);
      setMachines(machRes.data);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  useEffect(() => {
    if (!connection) return;

    const handleRefresh = () => fetchData();
    connection.on('Refresh', handleRefresh);
    fetchData();

    return () => connection.off('Refresh', handleRefresh);
  }, [connection]);

  const active = schedules.filter(s => s.status === 'InProgress');

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '1.2em', padding: 20 }}>
      <h1 style={{ color: '#0f0', textAlign: 'center' }}>PRODUCTION FLOOR</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h2>ACTIVE JOBS</h2>
          {active.length === 0 ? (
            <p>No jobs running</p>
          ) : (
            active.map(s => (
              <div key={s.scheduleID} style={{ border: '2px solid #0f0', padding: 15, margin: 10, borderRadius: 8 }}>
                <strong>{s.productionOrder?.product?.name}</strong><br/>
                Qty: {s.productionOrder?.quantity} | 
                Machine: {s.machine?.name || '—'}<br/>
                Ends: {new Date(s.endDate).toLocaleString()}
              </div>
            ))
          )}
        </div>
        <div>
          <h2>MACHINES</h2>
          {machines.map(m => (
            <div key={m.machineID} style={{ 
              background: m.status === 'Running' ? '#0f0' : '#f00', 
              color: '#fff', padding: 15, margin: 10, borderRadius: 8 
            }}>
              {m.name} - {m.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorDashboard;