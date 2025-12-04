// src/pages/PartEngineeringHub.tsx
import { useEffect, useState } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface QualityStandard {
  qualityStandardId: number;
  detailLetter: string;
  description: string;
  method: string;
  defectCode: string;
  imagePath?: string;
}

interface EngineeringData {
  partNumber: string;
  partName: string;
  revision: string;
  revDate?: string;
  drawingPath: string;
  cadFilePath: string;
  setupSheetPath: string;
  qsiPath: string;
  toolingPhotosPath: string;
  sampleApprovalNote: string;
  isReleased: boolean;
  releasedAt?: string;
  releasedBy: string;
  qualityStandards: QualityStandard[];
}

export default function PartEngineeringHub() {
  const { partNumber } = useParams<{ partNumber: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EngineeringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get product to resolve partNumber → productID
        interface ProductLookup {
        productID: number;
        partNumber: string;
        partName: string;
        }

        const productRes = await axios.get<ProductLookup[]>(`/api/products?partNumber=${partNumber}`);
        const product = productRes.data[0];
        if (!product) throw new Error("Part not found");

        // Then get engineering data
        const engRes = await axios.get<EngineeringData>(`/api/partengineering/${product.productID}`);
        setData(engRes.data);
      } catch (err) {
        toast.error("Failed to load engineering file");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partNumber]);

  if (loading) return <div style={{color:'#0f0', textAlign:'center', padding:'100px'}}>Loading Engineering File...</div>;
  if (!data) return <div style={{color:'#f44', textAlign:'center', padding:'100px'}}>No Engineering File Found</div>;

  const FileLink = ({ path, label }: { path: string; label: string }) =>
    path ? <a href={path} target="_blank" rel="noopener noreferrer" style={{color:'#0f0'}}>{label}</a> : <span style={{color:'#666'}}>— Not uploaded —</span>;

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:20, color:'#fff', fontFamily:'monospace'}}>
      <button onClick={() => navigate(-1)} style={{background:'#444', padding:'8px 16px', border:'none', borderRadius:6, color:'#0f0', marginBottom:20}}>Back</button>
      
      <h1 style={{fontSize:'2.5rem', color:'#0f0', textAlign:'center'}}>{data.partNumber} — {data.partName}</h1>
      
      <div style={{background:'#111', padding:20, borderRadius:12, border:'1px solid #0f0', marginBottom:30}}>
        <h2 style={{color:'#0f0', borderBottom:'2px solid #0f0', paddingBottom:8}}>PART APPROVAL</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:20}}>
          <div><strong>Revision:</strong> {data.revision || '—'}</div>
          <div><strong>Rev Date:</strong> {data.revDate ? new Date(data.revDate).toLocaleDateString() : '—'}</div>
          <div><strong>Released:</strong> {data.isReleased ? `Yes — ${data.releasedBy} on ${new Date(data.releasedAt!).toLocaleDateString()}` : <span style={{color:'#f80'}}>NOT RELEASED</span>}</div>
          <div><strong>Sample Note:</strong> {data.sampleApprovalNote || '—'}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:30}}>
        <div style={{background:'#111', padding:20, borderRadius:12, border:'1px solid #444'}}>
          <h3 style={{color:'#0f0'}}>DRAWINGS & FILES</h3>
          <div style={{lineHeight:2}}>
            <div>Drawing: <FileLink path={data.drawingPath} label="View PDF" /></div>
            <div>CAD File: <FileLink path={data.cadFilePath} label="Download" /></div>
            <div>Setup Sheet: <FileLink path={data.setupSheetPath} label="View PDF" /></div>
            <div>QSI: <FileLink path={data.qsiPath} label="View PDF" /></div>
            <div>Tooling Photos: <FileLink path={data.toolingPhotosPath} label="Open Folder" /></div>
          </div>
        </div>

        <div style={{background:'#111', padding:20, borderRadius:12, border:'1px solid #444'}}>
          <h3 style={{color:'#0f0'}}>QUALITY STANDARDS INSTRUCTIONS</h3>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid #0f0'}}>
                <th style={{textAlign:'left', padding:'8px'}}>Detail</th>
                <th style={{textAlign:'left', padding:'8px'}}>Description</th>
                <th style={{padding:'8px'}}>M/M</th>
                <th style={{padding:'8px'}}>Defect</th>
              </tr>
            </thead>
            <tbody>
              {data.qualityStandards.length === 0 && 
                <tr><td colSpan={4} style={{textAlign:'center', color:'#666', padding:20}}>No standards defined</td></tr>
              }
              {data.qualityStandards.map((qs, i) => (
                <tr key={i} style={{borderBottom:'1px solid #333'}}>
                  <td style={{padding:'8px', fontWeight:'bold', color:'#0f0'}}>{qs.detailLetter}</td>
                  <td style={{padding:'8px'}}>{qs.description}</td>
                  <td style={{padding:'8px', textAlign:'center'}}>{qs.method}</td>
                  <td style={{padding:'8px', textAlign:'center', color: qs.defectCode === 'CR' ? '#f44' : '#ff0'}}>{qs.defectCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.qualityStandards.some(q => q.imagePath) && (
        <div style={{background:'#111', padding:20, borderRadius:12, border:'1px solid #444'}}>
          <h3 style={{color:'#0f0', marginBottom:20}}>VISUAL STANDARDS</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20}}>
            {data.qualityStandards.filter(q => q.imagePath).map((qs, i) => (
              <div key={i} style={{textAlign:'center'}}>
                <img src={qs.imagePath} alt={qs.description} style={{maxWidth:'100%', maxHeight:400, border:'2px solid #0f0', borderRadius:8}} />
                <div style={{marginTop:8, fontSize:'0.9rem'}}><strong>{qs.detailLetter}:</strong> {qs.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}