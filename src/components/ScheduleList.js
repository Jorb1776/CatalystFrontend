import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScheduleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prodOrderID: '',
    startDate: '',
    endDate: '',
    status: 'Scheduled',
    machineID: '',     // ← Added
    color: '#3174ad'   // ← Added
  });
  const [orders, setOrders] = useState([]);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load Production Orders
    axios.get('/api/productionorders', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => setOrders(res.data))
      .catch(err => console.error('Orders load failed:', err));

    // Load Machines
    axios.get('/api/machines', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => setMachines(res.data))
      .catch(err => console.error('Machines load failed:', err));

    // Load Schedule if editing
    if (id) {
      axios.get(`/api/productionschedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const s = res.data;
        setForm({
          prodOrderID: s.prodOrderID || '',
          startDate: s.startDate || '',
          endDate: s.endDate || '',
          status: s.status || 'Scheduled',
          machineID: s.machineID || '',
          color: s.color || '#3174ad'
        });
      }).catch(err => {
        console.error('Schedule load failed:', err);
        navigate('/schedules');
      });
    }
  }, [id, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Not logged in");
      return;
    }

    const payload = {
      ProdOrderID: Number(form.prodOrderID),
      StartDate: form.startDate,
      EndDate: form.endDate,
      Status: form.status,
      MachineID: Number(form.machineID),
      Color: form.color
    };

    const url = id ? `/api/productionschedules/${id}` : '/api/productionschedules';
    const method = id ? 'put' : 'post';

    try {
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/schedules');
    } catch (err) {
      const msg = err.response?.data || err.message;
      alert(`Save failed: ${msg}`);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '20px auto' }}>
      <h2>{id ? 'Edit' : 'New'} Schedule</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <label>Production Order:</label>
          <select
            value={form.prodOrderID}
            onChange={e => setForm({ ...form, prodOrderID: e.target.value })}
            required
            style={{ width: '100%', padding: 8 }}
          >
            <option value="">Select Order</option>
            {orders.map(order => (
              <option key={order.prodOrderID} value={order.prodOrderID}>
                {order.product?.name} (Qty: {order.quantity})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Machine:</label>
          <select
            value={form.machineID}
            onChange={e => setForm({ ...form, machineID: e.target.value })}
            required
            style={{ width: '100%', padding: 8 }}
          >
            <option value="">Select Machine</option>
            {machines.map(m => (
              <option key={m.machineID} value={m.machineID}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Color:</label>
          <input
            type="color"
            value={form.color}
            onChange={e => setForm({ ...form, color: e.target.value })}
            style={{ width: '100%', height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Start Date:</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>End Date:</label>
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Status:</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            style={{ width: '100%', padding: 8 }}
          >
            <option>Scheduled</option>
            <option>InProgress</option>
            <option>Completed</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '10px 20px', marginRight: 10 }}>
          Save
        </button>
        <button type="button" onClick={() => navigate('/schedules')} style={{ padding: '10px 20px' }}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ScheduleForm;