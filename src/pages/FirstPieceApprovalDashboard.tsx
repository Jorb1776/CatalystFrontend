// src/pages/FirstPieceApprovalDashboard.tsx
import { useEffect, useState } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';
import { getUsernameFromToken } from '../utils/jwt';
import React from 'react';
import AuthImage from '../components/AuthImage';

interface PendingApproval {
  workOrderId: number;
  poNumber: string;
  partNumber: string;
  partName?: string;
  quantity: number;
  photoPath: string;
  submittedBy: string;
  submittedAt: string;
  inspectorNote?: string;
}

export default function FirstPieceApprovalDashboard() {
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

const getUsername = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return "Supervisor";

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.unique_name || payload.name || payload.email || payload.sub || "Supervisor";
  } catch {
    return "Supervisor";
  }
};


  const loadPending = async () => {
    try {
      const res = await axios.get('/api/sampleapproval/pending');
      setPending(res.data as PendingApproval[]);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

const approve = async (id: number) => {
  if (!confirm('Approve this first piece?')) return;

  const username = getUsernameFromToken() || "Supervisor";

  try {
    await axios.post(`/api/sampleapproval/${id}/approve`, 
      { approvedBy: username },
      { headers: { 'Content-Type': 'application/json' } }
    );

    toast.success(`Approved by ${username}!`);
    setPending(p => p.filter(x => x.workOrderId !== id));
  } catch (err) {
    console.error(err);
    toast.error('Approve failed');
  }
};

  const reject = async (id: number) => {
    if (!confirm('REJECT this first piece? It will go back to New.')) return;
    try {
      await axios.post(`/api/sampleapproval/${id}/reject`);
      toast.success('Rejected — returned to New');
      setPending(p => p.filter(x => x.workOrderId !== id));
    } catch {
      toast.error('Reject failed');
    }
  };

  if (loading) return <div style={{color:'#0f0',textAlign:'center',padding:'100px'}}>Loading Approvals...</div>;

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:20,color:'#fff',fontFamily:'monospace'}}>
      <h1 style={{fontSize:'3rem',color:'#0f0',textAlign:'center',marginBottom:40}}>
        FIRST-PIECE APPROVAL QUEUE
      </h1>
            {pending.length === 0 ? (
        <div style={{textAlign:'center',color:'#0f0',fontSize:'2rem',padding:'100px'}}>
          No pending approvals
        </div>
      ) : (
        <div style={{display:'grid',gap:30}}>
          {pending.map(item => (
            <div key={item.workOrderId} style={{
              background:'#111',
              border:'3px solid #ff0',
              borderRadius:12,
              padding:20,
              display:'grid',
              gridTemplateColumns:'1fr 400px',
              gap:30
            }}>
              <div>
                <h2 style={{color:'#ff0',margin:'0 0 10px'}}>WO {item.workOrderId}</h2>
                <div style={{lineHeight:1.8,fontSize:'1.1rem'}}>
                  <div><strong>PO:</strong> {item.poNumber}</div>
                  <div><strong>Part:</strong> {item.partNumber} {item.partName && `— ${item.partName}`}</div>
                  <div><strong>Qty:</strong> {item.quantity}</div>
                  <div><strong>Submitted By:</strong> {item.submittedBy}</div>
                  <div><strong>Time:</strong> {new Date(item.submittedAt).toLocaleString()}</div>
                  {item.inspectorNote && (
                    <div style={{marginTop:10,background:'#222',padding:10,borderRadius:6}}>
                      <strong>Note:</strong> {item.inspectorNote}
                    </div>
                  )}
                </div>
              </div>

              <div style={{textAlign:'center'}}>
                <AuthImage photoPath={item.photoPath} style={{maxWidth:'100%', maxHeight:400}} />
                <div style={{marginTop:20,display:'flex',gap:15,justifyContent:'center'}}>
                  <button onClick={() => approve(item.workOrderId)} style={{
                    background:'#0f0',color:'#000',padding:'15px 40px',borderRadius:8,fontSize:'1.3rem',fontWeight:'bold'
                  }}>
                    APPROVE
                  </button>
                  <button onClick={() => reject(item.workOrderId)} style={{
                    background:'#f44',color:'#fff',padding:'15px 40px',borderRadius:8,fontSize:'1.3rem',fontWeight:'bold'
                  }}>
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


//   const [src, setSrc] = useState('/placeholder.jpg');

//   useEffect(() => {
//     if (!photoPath) {
//       setSrc('/placeholder.jpg');
//       return;
//     }

//     const fileName = photoPath.split('/').pop() || '';
//     if (!fileName) {
//       setSrc('/placeholder.jpg');
//       return;
//     }

//     let cancelled = false;

//     axios.get(`/api/sampleapproval/photo/${fileName}`, { responseType: 'blob' })
//       .then(res => {
//         if (cancelled) return;
//         const url = URL.createObjectURL(res.data as Blob);
//         setSrc(url);
//       })
//       .catch(() => {
//         if (!cancelled) setSrc('/placeholder.jpg');
//       });

//     return () => {
//       cancelled = true;
//       if (src !== '/placeholder.jpg') {
//         URL.revokeObjectURL(src);
//       }
//     };
//   }, [photoPath]);

//   return (
//     <img
//       src={src}
//       alt="First piece"
//       style={{ maxWidth: '100%', maxHeight: 500, border: '3px solid #0f0', borderRadius: 8 }}
//     />
//   );
// });