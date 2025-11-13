// src/components/ScheduleList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  // ADD
import axios from '../axios';

interface ApiSchedule {
  scheduleID: number;
  workOrder?: {
    poNumber?: string;
    partNumber?: string;
    quantity?: number;
    status?: string;        // ADD
  };
  startDate: string;
  endDate: string;
  machine?: string;         // ADD if exists
}

interface Schedule extends ApiSchedule {
  scheduleId: number;
}

export default function ScheduleList() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();  // ADD

  // Helper function
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get<ApiSchedule[]>('/api/schedule', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const mapped = res.data.map(item => ({
          ...item,
          scheduleId: item.scheduleID  // Map to camelCase
        }));

        setSchedules(mapped);
      } catch (err) {
        console.error('Schedule fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  if (loading) return <p>Loading schedules...</p>;

  return (
    <div>
      {schedules.map(s => (
        <div
          key={s.scheduleID}
          onClick={() => navigate(`/schedule/edit/${s.scheduleID}`)} 
          style={{ cursor: 'pointer', padding: 12, borderBottom: '1px solid #444' }}
        >
          <div>
            <strong>{s.workOrder?.poNumber || '—'}</strong> × {s.workOrder?.quantity || '?'}
          </div>
          <div>
            {formatDate(s.startDate)} → {formatDate(s.endDate)}
          </div>
          <div>
            Status: <strong>{s.workOrder?.status || '—'}</strong> | 
            Machine: <strong>{s.machine || '—'}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}