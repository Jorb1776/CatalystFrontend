// src/components/FloorDashboard.tsx
import { useEffect, useState } from 'react';
import axios from '../axios';
import { getConnection, startSignalR } from '../signalr';
import { useNavigate } from 'react-router-dom';
import { WorkOrderCard } from './WorkOrderCard';

interface ApiWorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  quantityActual?: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
}

type WorkOrder = ApiWorkOrder;

export default function FloorDashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signalRStatus, setSignalRStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const navigate = useNavigate();
  const [view, setView] = useState<'floor' | 'completed'>('floor');
  const [floorSearch, setFloorSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [actualQty, setActualQty] = useState<string>('');

      const [confirmAction, setConfirmAction] = useState<{
      id: number;
      type: 'start' | 'undo';
      wo: WorkOrder;
    } | null>(null);

  // FILTERS
  const filteredActive = workOrders
    .filter(wo => wo.status !== 'Done')
    .filter(wo =>
      wo.poNumber.toLowerCase().includes(floorSearch.toLowerCase()) ||
      wo.partNumber.toLowerCase().includes(floorSearch.toLowerCase())
    );

    const filteredCompleted = workOrders
      .filter(wo => wo.status === 'Done')
      .filter(wo =>
        wo.poNumber.toLowerCase().includes(completedSearch.toLowerCase()) ||
        wo.partNumber.toLowerCase().includes(completedSearch.toLowerCase())
      )
      .sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });


    const startOrder = async (id: number) => {
      const wo = workOrders.find(w => w.workOrderId === id);
      if (!wo) return;

      setWorkOrders(prev => prev.map(w =>
        w.workOrderId === id
          ? { ...w, status: 'Active', startDate: new Date().toISOString() }
          : w
      ));

      try {
        await axios.post(`/api/workorder/${id}/start`);  // ← POST, not PUT
      } catch (err: any) {
        console.error('Start failed:', err);
        alert(`Failed to start: ${err.response?.data || err.message}`);
        setWorkOrders(prev => prev.map(w =>
          w.workOrderId === id ? { ...w, status: wo.status, startDate: wo.startDate } : w
        ));
      }
    };


    const completeOrder = async () => {
      if (!completingId || !actualQty || parseInt(actualQty) <= 0) return;

      try {
        await axios.post(`/api/workorder/${completingId}/complete`, {  // ← POST
          quantityActual: parseInt(actualQty)
        });

        setWorkOrders(prev => prev.map(wo => 
          wo.workOrderId === completingId 
            ? { ...wo, status: 'Done', quantityActual: parseInt(actualQty), endDate: new Date().toISOString() }
            : wo
        ));
        setCompletingId(null);
        setActualQty('');
      } catch (err: any) {
        console.error('Complete failed:', err);
        alert(`Failed to complete: ${err.response?.data || err.message}`);
      }
    };

    useEffect(() => {
      const loadWorkOrders = async () => {
        try {
          const res = await axios.get<WorkOrder[]>('/api/workorder');
          setWorkOrders(res.data);
          setLoading(false);
        } catch (err) {
          setError('Load failed');
          setLoading(false);
        }
      };

    loadWorkOrders();

    const initSignalR = async () => {
      try {
        const conn = await startSignalR();
        setSignalRStatus('connected');
        conn.on('FloorUpdate', (msg: { action: string; data: any }) => {
            if (msg.action === 'WorkOrderUpdated') {
              setWorkOrders(prev => prev.map(wo =>
                wo.workOrderId === msg.data.workOrderId
                  ? { ...wo, ...msg.data }  // dto has camelCase
                  : wo
              ));
          }
          else if (msg.action === 'WorkOrderCreated') {
            setWorkOrders(prev => [...prev, msg.data]);
          }
          else if (msg.action === 'WorkOrderDeleted') {
            setWorkOrders(prev => prev.filter(wo => wo.workOrderId !== msg.data.workOrderId));
          }
        });
      } catch (err) {
        setSignalRStatus('error');
      }
    };

    initSignalR();

    return () => {
      const conn = getConnection();
      if (conn) conn.stop();
    };
  }, []);

      const undoStart = async (id: number) => {
          const wo = workOrders.find(w => w.workOrderId === id);
          if (!wo) return;

          setWorkOrders(prev => prev.map(w =>
            w.workOrderId === id
              ? { ...w, status: 'New', startDate: undefined }
              : w
          ));

          try {
            await axios.post(`/api/workorder/${id}/undo-start`);
          } catch (err: any) {
            console.error('Undo failed:', err);
            alert(`Undo failed: ${err.response?.data || err.message}`);
            setWorkOrders(prev => prev.map(w =>
              w.workOrderId === id ? { ...w, status: wo.status, startDate: wo.startDate } : w
            ));
          }
        };

  return (
    
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh' }}>
      

      
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView('floor')} style={{ background: view === 'floor' ? '#0f0' : '#444', color: view === 'floor' ? '#000' : '#fff', padding: '8px 16px', borderRadius: 8 }}>
          Floor
        </button>
        <button onClick={() => setView('completed')} style={{ background: view === 'completed' ? '#0f0' : '#444', color: view === 'completed' ? '#000' : '#fff', padding: '8px 16px', borderRadius: 8 }}>
          Completed
        </button>

        <button
            onClick={() => navigate('/workorder/new')}
            style={{
              background: '#0f0',
              color: '#111',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 'bold'
            }}
          >
            + New Work Order
          </button>
      </div>


      {view === 'floor' ? (
        <div>
          <input
            type="text"
            placeholder="Search floor..."
            value={floorSearch}
            onChange={e => setFloorSearch(e.target.value)}
            style={{ width: '65%', padding: 12, background: '#222', color: '#fff', border: '1px solid #0f0', borderRadius: 8, marginBottom: 16 }}
          />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {filteredActive.map(wo => (
        <WorkOrderCard
          key={wo.workOrderId}
          wo={wo}
          navigate={navigate}
          onComplete={(id) => {
            const order = workOrders.find(w => w.workOrderId === id);
            if (order) {
              setCompletingId(id);
              setActualQty(order.quantity.toString());
            }
          }}
          setConfirmAction={setConfirmAction}
        />
              ))}
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search completed..."
            value={completedSearch}
            onChange={e => setCompletedSearch(e.target.value)}
            style={{ width: '65%', padding: 12, background: '#222', color: '#fff', border: '1px solid #0f0', borderRadius: 8, marginBottom: 16 }}
          />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {filteredCompleted.map(wo => (
              <div key={wo.workOrderId} style={{ background: '#222', padding: 16, borderRadius: 12, border: '1px solid #0f0' }}>
                <h3 style={{ color: '#0f0', margin: '0 0 8px' }}>{wo.partNumber}</h3>
                <div style={{ fontSize: '0.8rem' }}>PO: {wo.poNumber}</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                  Quantity Produced: {wo.quantityActual ?? wo.quantity}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                  Completed: {wo.endDate ? new Date(wo.endDate).toLocaleDateString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


        {/* START / UNDO CONFIRM MODAL */}
        {confirmAction && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} onClick={() => setConfirmAction(null)}>
            <div style={{ background: '#111', padding: 20, borderRadius: 8, width: 300, color: '#fff' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 12px', color: confirmAction.type === 'start' ? '#0f0' : '#f80' }}>
                {confirmAction.type === 'start' ? 'Start Work Order?' : 'Undo Start?'}
              </h3>
              <p style={{ fontSize: '0.9rem', margin: '0 0 8px' }}>
                WO: <strong>{confirmAction.wo.workOrderId}</strong> — {confirmAction.wo.partNumber}
              </p>
              <p style={{ fontSize: '0.9rem', margin: '0 0 16px', color: '#aaa' }}>
                PO: {confirmAction.wo.poNumber}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmAction(null)} style={{ background: '#444', color: '#fff', padding: '6px 12px', borderRadius: 4 }}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'start') {
                      startOrder(confirmAction.id);
                    } else {
                      undoStart(confirmAction.id);
                    }
                    setConfirmAction(null);
                  }}
                  style={{
                    background: confirmAction.type === 'start' ? '#0f0' : '#f80',
                    color: '#000',
                    padding: '6px 12px',
                    borderRadius: 4
                  }}
                >
                  {confirmAction.type === 'start' ? 'Start' : 'Undo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETE MODAL */}
        {completingId && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} onClick={() => setCompletingId(null)}>
            <div style={{ background: '#111', padding: 20, borderRadius: 8, width: 300, color: '#fff' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 12px', color: '#0f0' }}>Complete Order</h3>
              <p style={{ fontSize: '0.9rem', margin: '0 0 8px' }}>
                PO: {workOrders.find(w => w.workOrderId === completingId)?.poNumber}
              </p>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Actual Produced:
                <input
                  type="number"
                  value={actualQty}
                  onChange={e => setActualQty(e.target.value)}
                  style={{ width: '100%', padding: 6, background: '#222', color: '#0f0', border: '1px solid #0f0', borderRadius: 4, marginTop: 4 }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setCompletingId(null)} style={{ background: '#444', color: '#fff', padding: '6px 12px', borderRadius: 4 }}>
                  Cancel
                </button>
                <button onClick={completeOrder} style={{ background: '#0f0', color: '#000', padding: '6px 12px', borderRadius: 4 }}>
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}

      {/* SIGNALR STATUS */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, fontSize: '0.8rem', color: signalRStatus === 'connected' ? '#0f0' : '#f80' }}>
        SignalR: {signalRStatus}
      </div>
    </div>
  );
}