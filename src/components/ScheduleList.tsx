// src/components/ScheduleList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../axios';

interface Schedule {
  scheduleId: number;  // ← Match backend DTO
  workOrderId: number;
  workOrder?: { poNumber: string; partNumber: string; quantity: number };
  startDate: string;
  endDate: string;
  status: string;
  machineID: number;
  machine?: { name: string };
  color?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const ScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchSchedules = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get('/api/productionschedules', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // console.log('Raw API data:', res.data);

      const mapped = res.data.map((item: any) => ({
        ...item,
        scheduleId: item.scheduleID  
      }));

      // console.log('Mapped data:', mapped);

      setSchedules(mapped);

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchSchedules();
}, [navigate, location.state?.refreshed]);

  if (loading) return <p style={{ color: '#0f0', textAlign: 'center' }}>Loading schedules...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>Production Schedules</h2>
        <button
          onClick={() => navigate('/schedules/new')}
          style={{
            background: '#0f0',
            color: '#111',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#0c0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#0f0')}
        >
          + New Schedule
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {schedules.map((s) => (
          <div
            key={s.scheduleId}
            style={{
              background: '#222',
              border: '1px solid #333',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#0f0', fontSize: '1.1rem' }}>#{s.workOrder?.poNumber || 'N/A'}</strong>{' '}
              <span style={{ color: '#fff' }}>→ {s.workOrder?.partNumber || 'N/A'} × {s.workOrder?.quantity || 'N/A'}</span>
            </div>
            <div style={{ color: '#ddd', marginBottom: 8 }}>
              {formatDate(s.startDate)} to {formatDate(s.endDate)} | <span style={{ color: getStatusColor(s.status) }}>{s.status}</span>
            </div>
            <div style={{ color: '#ddd' }}>
              Machine: <span style={{ color: '#0f0' }}>{s.machine?.name || '—'}</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate(`/schedules/${s.scheduleId}`)}
                style={{
                  background: '#333',
                  color: '#0f0',
                  padding: '8px 16px',
                  border: '1px solid #0f0',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#0f0';
                  e.currentTarget.style.color = '#111';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#333';
                  e.currentTarget.style.color = '#0f0';
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return '#0f0';
    case 'in progress': return '#ff0';
    case 'pending': return '#f90';
    default: return '#ddd';
  }
};

export default ScheduleList;