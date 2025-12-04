// src/components/WorkOrderCard.tsx (QSI button added)
import { useState, useEffect } from 'react';    
import { useNavigate } from 'react-router-dom';
import axios from 'axios';                            
import { getStatusColor } from '../utils/statusColors';

interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  description?: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  productId?: number;  
}

interface WorkOrderCardProps {
  wo: WorkOrder;
  onComplete: (id: number) => void;
  onResendEmail: (id: number) => void;
  setConfirmAction: (action: any) => void;
  setShowFirstPiece: (wo: WorkOrder | null) => void;
  navigate: (path: string) => void;  
}

export const WorkOrderCard = ({
  wo, onComplete, onResendEmail, setConfirmAction, setShowFirstPiece, navigate  
}: WorkOrderCardProps) => {
  const [showLightbox, setShowLightbox] = useState(false);
  // NO useNavigate() here anymore

  const openQsi = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wo.productId) {
      navigate(`/qsi/${wo.productId}`);
    } else {
      alert("Product ID not available");
    }
  };

  const [hasQsi, setHasQsi] = useState<boolean | null>(null);

    useEffect(() => {
      if (wo.productId) {
        checkQsiExists();
      } else {
        setHasQsi(null);
      }
    }, [wo.productId]);

    const checkQsiExists = async () => {
      if (!wo.productId) return;
      try {
        await axios.get(`/api/qsi/product/${wo.productId}`);
        setHasQsi(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasQsi(false);
        } else {
          setHasQsi(null);
        }
      }
    };

    


  return (
    <>
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
          lineHeight: 1.3,
          position: 'relative',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start'
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={`/PartImages/${wo.partNumber}.jpg`}
            onError={(e) => e.currentTarget.src = '/PartImages/placeholder.jpg'}
            onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
            style={{
              width: 48, height: 48,
              objectFit: 'cover',
              borderRadius: 4,
              border: '1px solid #0f0'
            }}
            alt="Part"
          />
          <div
            onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f0' }}>
            {wo.partNumber}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f0' }}>
            Qty: {wo.quantity}
          </div>
          <div style={{ fontSize: '0.8rem' }}>PO: {wo.poNumber}</div>
          <div style={{ fontSize: '0.8rem', color: '#0b0', marginTop: 4 }}>
            {wo.description}
          </div>

          {/* QSI BUTTON — always visible */}
            {wo.productId && (
              <button
                onClick={openQsi}
                style={{
                  marginTop: 6,
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  background: hasQsi === false ? '#f33' : hasQsi === true ? '#ff0' : '#666',
                  color: hasQsi === false ? '#fff' : '#000',
                  boxShadow: hasQsi === false ? '0 0 8px #f33' : 'none',
                  animation: hasQsi === false ? 'pulse 2s infinite' : 'none',
                }}
                title={hasQsi === false ? 'QSI NOT CREATED!' : 'View QSI'}
              >
                {hasQsi === null ? '...' : hasQsi === false ? 'CREATE QSI' : 'QSI'}
              </button>
            )}

          {/* Status buttons */}
          {wo.status === 'New' && (
            <button onClick={(e) => { e.stopPropagation(); setShowFirstPiece(wo); }}
              style={{ marginLeft: 6, marginTop: 6, fontSize: '0.7rem', background: '#0af', color: '#000', padding: '3px 8px', borderRadius: 4 }}>
              Start
            </button>
          )}

          {wo.status === 'FirstPiecePending' && (
            <>
              <span style={{
                marginLeft: 6,
                padding: '3px 8px',
                borderRadius: 4,
                background: getStatusColor(wo.status),
                color: '#000',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}>
                Awaiting Approval
              </span>
              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: wo.workOrderId, type: 'undo', wo }); }}
                style={{ marginLeft: 6, marginTop: 6, fontSize: '0.7rem', background: '#f80', color: '#000', padding: '3px 8px', borderRadius: 4 }}>
                Undo
              </button>
            </>
          )}

          {wo.status === 'Active' && (
            <button onClick={(e) => { e.stopPropagation(); onComplete(wo.workOrderId); }}
              style={{ marginLeft: 6, marginTop: 6, fontSize: '0.7rem', background: 'green', color: '#fff', padding: '3px 8px', borderRadius: 4 }}>
              Complete
            </button>
          )}

          {wo.status === 'Done' && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: wo.workOrderId, type: 'resend', wo }); }}
              style={{ marginLeft: 6, marginTop: 6, fontSize: '0.7rem', background: '#0af', color: '#000', padding: '3px 8px', borderRadius: 4 }}>
              Resend Email
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div onClick={() => setShowLightbox(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={`/PartImages/${wo.partNumber}.jpg`}
            onError={(e) => e.currentTarget.src = '/PartImages/placeholder.jpg'}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', border: '3px solid #0f0', borderRadius: 8 }}
            alt="Part enlarged"
          />
        </div>
      )}
    </>
  );
};