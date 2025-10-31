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

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/floor')
      .withAutomaticReconnect()
      .build();

    conn.start()
      .then(() => {
        console.log('SignalR Connected');
        conn.on('WorkOrderCreated', (id: number) => {
          fetch(`/api/workorder/${id}`).then(r => r.json()).then(data => {
            setOrders(prev => [...prev.filter(o => o.workOrderId !== id), data]);
          });
        });
      });

    setConnection(conn);

    // Load initial
    fetch('/api/workorder').then(r => r.json()).then(setOrders);

    return () => { conn.stop(); };
  }, []);

  const columns = ['New', 'Active', 'OnHold', 'Done'];
  const priorityColor = (p: number) => p <= 2 ? 'bg-red-100 border-red-500' : p <= 4 ? 'bg-yellow-100' : 'bg-green-100';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Production Floor</h1>
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col} className="bg-gray-50 p-4 rounded-lg min-h-screen">
            <h2 className="font-semibold text-lg mb-2">{col} ({orders.filter(o => o.status === col).length})</h2>
            <div className="space-y-2">
              {orders
                .filter(o => o.status === col)
                .map(o => (
                  <div key={o.workOrderId} className={`p-3 border-l-4 rounded ${priorityColor(o.priority)}`}>
                    <div className="font-medium">{o.poNumber}</div>
                    <div className="text-sm">{o.partNumber} × {o.quantity}</div>
                    <div className="text-xs text-gray-600">{o.customerName}</div>
                    {o.dueDate && <div className="text-xs">Due: {new Date(o.dueDate).toLocaleDateString()}</div>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}