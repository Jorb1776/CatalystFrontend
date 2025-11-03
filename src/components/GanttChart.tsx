// src/components/GanttChart.tsx
import { useEffect, useState } from 'react';
import { Gantt } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import axios from '../axios';
import { getConnection } from '../signalr';

interface WorkOrderTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  duration: number;
  progress: number;
  type: 'task';
  workOrderId: number;
  poNumber: string;
  status: string;
}

export default function GanttChart() {
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('/api/workorder', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ganttTasks: WorkOrderTask[] = res.data.map((wo: any) => {
        let start = wo.startDate ? new Date(wo.startDate) : new Date(wo.dueDate);
        let end = wo.endDate ? new Date(wo.endDate) : new Date(wo.dueDate);

        if (!wo.startDate) {
          start = new Date(end);
          start.setDate(start.getDate() - 2);
        }

        const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

        return {
          id: wo.workOrderId,
          text: `${wo.poNumber} | ${wo.partNumber || '—'} × ${wo.quantity || 0}`,
          start,
          end,
          duration,
          progress: wo.status === 'Done' ? 100 : wo.status === 'Active' ? 70 : wo.status === 'New' ? 20 : 0,
          type: 'task' as const,
          workOrderId: wo.workOrderId,
          poNumber: wo.poNumber,
          status: wo.status
        };
      });

      setTasks(ganttTasks);
    } catch (err) {
      console.error('Gantt fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const connection = getConnection();
    if (!connection) return;

    const handler = () => fetchData();
    connection.on('FloorUpdate', handler);
    return () => connection.off('FloorUpdate', handler);
  }, []);

  const handleTaskChange = async (task: WorkOrderTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    try {
      await axios.put(`/api/workorder/${task.id}/reschedule`, {
        startDate: task.start.toISOString(),
        endDate: task.end.toISOString()
      });
    } catch (err) {
      console.error('Reschedule failed:', err);
    }
  };

  if (loading) return <p style={{ color: '#0f0', textAlign: 'center', padding: 40 }}>Loading Gantt...</p>;

  return (
    <div style={{
      padding: 24,
      background: '#111',
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: '1px solid #0f0'
      }}>
        <h1 style={{
          color: '#0f0',
          margin: 0,
          fontSize: '2rem',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(0,255,0,0.3)'
        }}>
          Production Gantt
        </h1>
        <div style={{
          background: '#0f0',
          color: '#111',
          padding: '8px 16px',
          borderRadius: 6,
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          {tasks.length} Active Orders
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: 16 }}>
            No work orders scheduled
          </p>
          <p style={{ color: '#0a0' }}>
            Create work orders with <strong>Start</strong> and <strong>End</strong> dates to see them here.
          </p>
        </div>
      ) : (
<div className="gantt-container" style={{ height: 600 }}>
  <Gantt
    tasks={tasks}
    onTaskChange={handleTaskChange}
    scales={[
      { unit: 'day', step: 1, format: 'MMM dd' },
      { unit: 'week', step: 1, format: 'wo' },
      { unit: 'month', step: 1, format: 'MMM yyyy' }
    ]}
  />
</div>
      )}
    </div>
  );
}