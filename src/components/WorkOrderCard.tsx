// src/components/WorkOrderCard.tsx
import { getStatusColor } from '../utils/statusColors';

interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
}

interface WorkOrderCardProps {
  wo: WorkOrder;
  navigate: (path: string) => void;
  onComplete: (id: number) => void;
  setConfirmAction: (action: { id: number; type: 'start' | 'undo'; wo: WorkOrder } | null) => void;
}

export const WorkOrderCard = ({ 
  wo, navigate, onComplete, setConfirmAction 
}: WorkOrderCardProps) => {

  return (
    <div
      onClick={() => navigate(`/workorder/edit/${wo.workOrderId}`)}
      style={{
        border: '1px solid #444',
        borderRadius: 6,
        padding: 10,
        background: '#111',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
        lineHeight: 1.3
      }}
    >
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f0' }}>
        <strong>{wo.partNumber}</strong> × {wo.quantity}
      </div>
      <div style={{ fontSize: '0.8rem' }}>PO: {wo.poNumber}</div>
      <div style={{
        marginTop: 6,
        padding: '2px 6px',
        borderRadius: 3,
        background: getStatusColor(wo.status),
        color: '#000',
        fontWeight: 'bold',
        fontSize: '0.7rem',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        {wo.status}
      </div>

    {wo.status === 'New' && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmAction({ id: wo.workOrderId, type: 'start', wo });
        }}
        style={{ marginTop: 4, fontSize: '0.7rem', background: '#0a0', color: '#000', padding: '2px 6px', borderRadius: 3 }}
      >
        Start
      </button>
    )}

      {wo.status === 'Active' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(wo.workOrderId);  // ← Pass ID
          }}
          style={{ marginTop: 4, fontSize: '0.7rem', background: '#08f', color: '#fff', padding: '2px 6px', borderRadius: 3 }}
        >
          Complete
        </button>
      )}

      {wo.status === 'Active' && (
        <button
          onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({ id: wo.workOrderId, type: 'undo', wo });
              }}
          style={{
            marginTop: 4,
            fontSize: '0.7rem',
            background: '#f80',
            color: '#000',
            padding: '2px 6px',
            borderRadius: 3
          }}
        >
          Undo Start
        </button>
      )}

    </div>
  );
};