// src/pages/WorkOrderEdit.tsx (fixed)
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkOrderForm from '../components/WorkOrderForm';

export default function WorkOrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={backBtn}>Back</button>
      <WorkOrderForm
        workOrderId={id ? parseInt(id) : undefined}
        onSuccess={() => navigate('/floor')}
        onCancel={() => navigate('/floor')}
      />
    </div>
  );
}

const backBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#0f0',
  border: '1px solid #0f0',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  marginBottom: 16
};