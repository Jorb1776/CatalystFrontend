// src/components/GanttChart.tsx
import React, { useEffect, useState } from 'react';
import { Gantt } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import axios from '../axios';
import { getConnection } from '../signalr';

interface ApiWorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber?: string;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  dueDate: string;
  status: string;
}

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
  color: string;
  tooltip: string;
}

export default function GanttChart() {
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get<ApiWorkOrder[]>('/api/workorder');

      const ganttTasks: WorkOrderTask[] = res.data.map(wo => {
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
          progress: getProgress(wo.status),
          type: 'task',
          workOrderId: wo.workOrderId,
          poNumber: wo.poNumber,
          status: wo.status,
          color: getStatusColor(wo.status),
          tooltip: `Qty: ${wo.quantity || 0}\nDue: ${new Date(wo.dueDate).toLocaleString()}\nStatus: ${wo.status}`
        };
      });
      setTasks(ganttTasks);
    } catch {
      console.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const connection = getConnection();
    if (connection) {
      connection.on('FloorUpdate', (msg) => {
        if (msg.action === 'WorkOrderCreated' || msg.action === 'WorkOrderUpdated' || msg.action === 'WorkOrderStatusChanged') {
          fetchData();
        } else if (msg.action === 'WorkOrderCompleted') {
          setTasks(prev =>
            prev.map(wo =>
              wo.workOrderId === msg.data.workOrderId 
                ? { ...wo, end: new Date(msg.data.endDate) }
                : wo
            )
          );
        } else {
          fetchData();
        }
      });
    }

    return () => {
      if (connection) connection.off('FloorUpdate');
    };
  }, []);

  const handleTaskChange = (task: WorkOrderTask) => {
    axios.put(`/api/workorder/${task.workOrderId}`, {
      startDate: task.start.toISOString(),
      endDate: task.end.toISOString()
    }).then(fetchData).catch(() => console.error('Update failed'));
  };

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return '#ffeb3b';
    case 'Active': return '#4caf50';
    case 'OnHold': return '#ff9800';
    case 'Done': return '#2196f3';
    case 'Cancelled': return '#f44336';
    default: return '#666';
  }
};

const getProgress = (status: string) => {
  switch (status) {
    case 'New': return 0;
    case 'Active': return 50;
    case 'Done': return 100;
    default: return 0;
  }
};