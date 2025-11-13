// src/components/ScheduleCalendar.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event as CalEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from '../axios';

const localizer = momentLocalizer(moment);

interface ApiSchedule {
  scheduleID: number;
  workOrder?: {
    poNumber?: string;
    partNumber?: string;
    quantity?: number;
  };
  startDate: string;
  endDate: string;
}

interface CalendarEvent extends CalEvent {
  title: string;
  start: Date;
  end: Date;
}

export default function ScheduleCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get<ApiSchedule[]>('/api/schedule', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const calEvents: CalendarEvent[] = res.data.map(s => ({
        title: `${s.workOrder?.poNumber || '—'} (${s.workOrder?.partNumber || ''} × ${s.workOrder?.quantity || '?'})`,
        start: new Date(s.startDate),
        end: new Date(s.endDate),
      }));

      setEvents(calEvents);
    } catch (err) {
      console.error('Schedule fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p style={{ color: '#0f0' }}>Loading schedule...</p>;

  return (
    <div style={{ height: 500, margin: '20px 0', background: '#111', padding: 10, borderRadius: 8 }}>
       <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
}