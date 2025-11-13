import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  customerName: string;
  quantity: number;
  status: string;
  priority: number;
  dueDate?: string;
}

export default function WorkOrderBoard() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  const columns = ['New', 'Active', 'OnHold', 'Done'];


  const startWO = async (id: number) => {
    const res = await fetch(`/api/workorder/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Start failed');
  };

  const completeWO = async (id: number) => {
    const res = await fetch(`/api/workorder/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Complete failed');
  };

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/floor')
      .withAutomaticReconnect()
      .build();

    conn.start()
      .then(() => {
        console.log('SignalR Connected');

        conn.on('FloorUpdate', (msg: { action: string; data: any }) => {
          if (msg.action === 'WorkOrderCreated') {
            setOrders(prev => {
              const exists = prev.some(o => o.workOrderId === msg.data.workOrderId);
              return exists ? prev : [...prev, msg.data];
            });
          }
          else if (msg.action === 'WorkOrderStatusChanged') {
            setOrders(prev =>
              prev.map(o =>
                o.workOrderId === msg.data.workOrderId
                  ? { ...o, status: msg.data.newStatus }
                  : o
              )
            );
          }
          else if (msg.action === 'WorkOrderDeleted') {
            setOrders(prev => prev.filter(o => o.workOrderId !== msg.data.workOrderId));
          }
        });
      })
      .catch(err => console.error('SignalR Error:', err));

    setConnection(conn);

    fetch('/api/workorder')
      .then(r => r.json())
      .then(setOrders);

    return () => { conn.stop(); };
  }, []);

  const priorityColor = (p: number) =>
    p <= 2 ? 'bg-red-100 border-red-500' : p <= 4 ? 'bg-yellow-100' : 'bg-green-100';

  return (
<div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Production Floor</h1>
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col} className="bg-gray-50 p-4 rounded-lg min-h-screen">
            <h2 className="font-semibold text-lg mb-2">
              {col} ({orders.filter(o => o.status === col).length})
            </h2>
            <div className="space-y-2">
            {orders
              .filter(o => o.status === col)
              .map(o => (
                <div key={o.workOrderId} className={`p-3 border-l-4 rounded ${priorityColor(o.priority)}`}>
                  <div className="font-medium">{o.poNumber}</div>
                  <div className="text-sm">{o.partNumber} × {o.quantity}</div>
                  <div className="text-xs text-gray-600">{o.customerName}</div>
                  {o.dueDate && <div className="text-xs">Due: {new Date(o.dueDate).toLocaleDateString()}</div>}

                  {/* START BUTTON */}
                    {o.status === 'New' && (
                      <button 
                        onClick={async () => {
                          try { await startWO(o.workOrderId); }
                          catch { alert('Failed to start'); }
                        }} 
                        className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Start
                      </button>
                    )}

                  {/* COMPLETE BUTTON */}
                  {o.status === 'Active' && (
                    <button 
                      onClick={() => completeWO(o.workOrderId)} 
                      className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}