// src/components/ScheduleCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import axios from '../axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getConnection } from '../signalr';  // ← Import shared

const localizer = momentLocalizer(moment);

export default function ScheduleCalendar() {
  const [events, setEvents] = useState<Event[]>([]);

  const loadSchedules = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('/api/productionschedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      const calEvents: Event[] = data.map((s: any) => ({
        title: `${s.workOrder?.poNumber || '—'} (${s.workOrder?.partNumber || ''} × ${s.workOrder?.quantity || '?'})`,
        start: new Date(s.startDate),
        end: new Date(s.endDate),
        allDay: true,
        resource: s,
        color: s.color || '#3174ad'
      }));
      setEvents(calEvents);
    } catch (err) {
      console.error('Calendar load failed:', err);
    }
  };

  useEffect(() => {
    loadSchedules();

    const connection = getConnection();
    if (!connection) return;

    const handler = () => {
      console.log('FloorUpdate → reload calendar');
      loadSchedules();
    };

    connection.on('FloorUpdate', handler);

    return () => {
      connection.off('FloorUpdate', handler);
    };
  }, []);

  const eventStyleGetter = (event: Event & { color?: string }) => ({
    style: {
      backgroundColor: event.color || '#3174ad',
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px'
    }
  });

  return (
    <div style={{ height: 500, margin: '20px 0' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
}