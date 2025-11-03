// src/components/ScheduleForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';

interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  quantity: number;
}

interface Machine {
  machineID: number;
  name: string;
}

const ScheduleForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
const [form, setForm] = useState({
  workOrderId: '',
  startDate: '',
  endDate: '',
  status: 'Scheduled',
  machineId: '',
  color: '#3174ad'
});
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Load Production Orders
    axios.get('/api/workorder', { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setOrders(res.data))
      .catch((err: any) => console.error('Orders load failed:', err));

    // Load Machines
    axios.get('/api/machines', { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setMachines(res.data))
      .catch((err: any) => console.error('Machines load failed:', err));

    // Load Schedule if editing
    if (id) {
      axios.get(`/api/productionschedules/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res: any) => {
          const s = res.data;
        setForm({
          workOrderId: s.workOrderId.toString(),
          startDate: s.startDate.split('T')[0],
          endDate: s.endDate.split('T')[0],
          status: s.status,
          machineId: s.machineId?.toString() || '',
          color: s.color || '#3174ad'
        });
        })
        .catch(() => navigate('/schedules'));
    }
  }, [id, navigate]);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) { navigate('/login'); return; }

  const payload = {
    WorkOrderId: +form.workOrderId,
    StartDate: form.startDate,
    EndDate: form.endDate,
    Status: form.status,
    MachineId: form.machineId ? +form.machineId : null,
    Color: form.color
  };

  try {
    if (id) {
      await axios.put(`/api/productionschedules/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await axios.post('/api/productionschedules', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    navigate('/schedules');
  } catch (err: any) {
    setError(err.response?.data?.title || 'Save failed');
  }
};

return (
  <div style={{ padding: 20 }}>
    <h2>{id ? 'Edit' : 'New'} Schedule</h2>
    {error && <p style={{ color: 'red' }}>{error}</p>}
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <label>
        Work Order:
        <select
          value={form.workOrderId}
          onChange={(e) => setForm({ ...form, workOrderId: e.target.value })}
          required
        >
          <option value="">Select...</option>
          {orders.map((order) => (
            <option key={order.workOrderId} value={order.workOrderId}>
              {order.poNumber} ({order.partNumber} × {order.quantity})
            </option>
          ))}
        </select>
      </label>

      <label>
        Start Date:
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          required
        />
      </label>

      <label>
        End Date:
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          required
        />
      </label>

      <label>
        Status:
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </label>

      <label>
        Machine:
        <select
          value={form.machineId}
          onChange={(e) => setForm({ ...form, machineId: e.target.value })}
        >
          <option value="">No Machine</option>
          {machines.map((machine) => (
            <option key={machine.machineID} value={machine.machineID}>
              {machine.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Color:
        <input
          type="color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ background: '#0f0', color: '#000', padding: '8px 16px', border: 'none', borderRadius: 4 }}>
          Save
        </button>
        <button
          type="button"
          onClick={() => navigate('/schedules')}
          style={{ background: '#666', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
);
};

export default ScheduleForm;