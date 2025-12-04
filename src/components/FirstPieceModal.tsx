import { useState } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';

// Import the type from FloorDashboard or define it here
interface WorkOrder {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  description?: string;
  status: string;
  priority: number;
  customerName: string;
  quantity: number;
  quantityActual?: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
}

interface Props {
  woId: number;
  partNumber: string;
  onClose: () => void;
  onSubmitted: () => void;
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
}

export default function FirstPieceModal({ 
  woId, 
  partNumber, 
  onClose, 
  onSubmitted, 
  setWorkOrders 
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!photo) return toast.error('Photo required');

    setSubmitting(true);
    const form = new FormData();
    form.append('photo', photo);
    form.append('note', note);
    form.append('submittedBy', 'Operator');

    try {
      await axios.post(`/api/sampleapproval/${woId}`, form);

      // Optimistic update – instant yellow card
      setWorkOrders(prev => prev.map(wo => 
        wo.workOrderId === woId
          ? { ...wo, status: 'FirstPiecePending', startDate: new Date().toISOString() }
          : wo
      ));

      toast.success('Submitted – Awaiting Approval');
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div style={{background:'#111',padding:30,borderRadius:12,border:'3px solid #ff0',width:520}}>
        <h2 style={{color:'#ff0',textAlign:'center'}}>FIRST-PIECE APPROVAL</h2>
        <h3 style={{color:'#fff'}}>{partNumber} — WO {woId}</h3>

        <div style={{margin:'20px 0'}}>
          <label style={{color:'#ff0',display:'block',marginBottom:8}}>First Piece Photo *</label>
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={{width:'100%',padding:10,background:'#222',color:'#0f0'}} />
        </div>

        <div style={{margin:'20px 0'}}>
          <label style={{color:'#ff0',display:'block',marginBottom:8}}>Notes</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} style={{width:'100%',height:100,background:'#222',color:'#0f0',padding:10}} />
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button onClick={onClose} disabled={submitting} style={{background:'#444',padding:'12px 24px',borderRadius:6}}>Cancel</button>
          <button onClick={submit} disabled={submitting} style={{background:'#ff0',color:'#000',padding:'12px 24px',borderRadius:6,fontWeight:'bold'}}>
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}