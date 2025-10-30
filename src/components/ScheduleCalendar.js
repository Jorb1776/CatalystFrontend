import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function ScheduleCalendar() {
  const [events, setEvents] = useState([]);  // ← Inside component

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/productionschedules', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const data = res.data;
      const calEvents = data.map(s => ({
        title: `${s.productionOrder?.product?.name || '—'} (Qty: ${s.productionOrder?.quantity || '?'})`,
        start: new Date(s.startDate),
        end: new Date(s.endDate),
        allDay: true,
        resource: s,
        color: s.color || '#3174ad'
      }));
      setEvents(calEvents);
    })
    .catch(err => console.error('Calendar load failed:', err));
  }, []);

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
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