// src/components/FloorDashboard.tsx
import { useEffect, useState } from 'react';
import axios from '../axios';  // Import configured axios
import { getConnection } from '../signalr';
import { useNavigate } from 'react-router-dom';

interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
}

export default function FloorDashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connection = getConnection();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('useEffect running');

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No auth token');
        setLoading(false);
        return;
      }
      console.log('Fetching work orders...');
      try {
        const res = await axios.get('/api/workorder', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Data fetched:', res.data);
        setWorkOrders(res.data);
      } catch (err: any) {
        console.error('Fetch failed:', err);
        setError(err.message || 'Fetch error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (!connection) return;

    const floorUpdateHandler = (msg: { action: string; data: any }) => {
      console.log('FloorUpdate:', msg);
      if (msg.action === 'WorkOrderStatusChanged') {
        setWorkOrders(prev =>
          prev.map(wo =>
            wo.workOrderId === msg.data.workOrderId ? { ...wo, status: msg.data.newStatus } : wo
          )
        );
      } else if (msg.action === 'WorkOrderCreated') {
        setWorkOrders(prev => [...prev, msg.data]);
      } else if (msg.action === 'WorkOrderDeleted') {
        setWorkOrders(prev => prev.filter(wo => wo.workOrderId !== msg.data.workOrderId));
      } else if (msg.action === 'WorkOrderRescheduled') {
        setWorkOrders(prev =>
          prev.map(wo =>
            wo.workOrderId === msg.data.workOrderId
              ? { ...wo, startDate: msg.data.startDate, endDate: msg.data.endDate }
              : wo
          )
        );
      } else {
        fetchData();
      }
    };

    connection.on('FloorUpdate', floorUpdateHandler);

    return () => {
      connection.off('FloorUpdate', floorUpdateHandler);
    };
  }, []);

  if (loading) return <p>Loading floor...</p>;
  if (error) return <p>Error: {error}</p>;

return (
  <div style={{ padding: 20 }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 24 
    }}>
      <h2 style={{ color: '#0f0', margin: 0 }}>Production Floor</h2>
      <button
        onClick={() => navigate('/workorder/new')}
        style={{
          background: '#0f0',
          color: '#111',
          padding: '10px 20px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#0c0'}
        onMouseOut={e => e.currentTarget.style.background = '#0f0'}
      >
        + New Work Order
      </button>
    </div>

    {workOrders.length === 0 ? (
      <p style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>
        No work orders. Click <strong>+ New Work Order</strong> to get started.
      </p>
    ) : (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 16 
      }}>
        {workOrders.map(wo => (
          <div
            key={wo.workOrderId}
            style={{
              border: '1px solid #444',
              borderRadius: 8,
              padding: 16,
              background: '#111',
              color: '#fff',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/workorder/edit/${wo.workOrderId}`)}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{wo.poNumber}</div>
            <div>Customer: <strong>{wo.customerName}</strong></div>
            <div>Qty: <strong>{wo.quantity}</strong></div>
            <div>Due: <strong>{new Date(wo.dueDate).toLocaleDateString()}</strong></div>
            <div style={{
              marginTop: 12,
              padding: '6px 10px',
              borderRadius: 4,
              background: getStatusColor(wo.status),
              color: '#000',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}>
              {wo.status}
            </div>
          </div>
        ))}
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