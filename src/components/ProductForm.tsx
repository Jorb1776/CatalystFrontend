// src/components/ProductForm.tsx (updated for productId)
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';
import { Mold, Product } from '../types/Product';

interface Material { materialID: number; name: string; }
interface Colorant { colorantID: number; name: string; code: string; }
interface Additive { additiveID: number; name: string; pricePerPound: number; letDownRatio: number; }
interface ProductAdditive { additiveID: number; percentage: number; }

interface ProductFormProps {
  productId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}


export default function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colorants, setColorants] = useState<Colorant[]>([]);
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [molds, setMolds] = useState<Mold[]>([]);
  const [selectedAdditives, setSelectedAdditives] = useState<{id: number, pct: string}[]>([]);

  const [form, setForm] = useState({
    partNumber: '', partName: '', materialId: '', colorantId: '', moldId: '',
    batchSize: '', note: '', boxSize: '', fullBoxQty: '', imagePath: '', moldPath: '',
    cavities: '', insertId: '', binId: '', unitPrice: '', description: ''
  });

  const BOX_SIZES = ['6x6x6','8x8x8','10x10x10','12x12x12','14x14x14','16x16x16','18x18x18','20x20x20'];

  // Load data
  useEffect(() => {
    Promise.all([
      axios.get<Material[]>('/api/materials'),
      axios.get<Colorant[]>('/api/colorants'),
      axios.get<Additive[]>('/api/additives'),
      axios.get<Mold[]>('/api/molds')
    ]).then(([m,c,a,mold]) => {
      setMaterials(m.data); setColorants(c.data); setAdditives(a.data); setMolds(mold.data);
    }).catch(() => toast.error('Load failed'));
  }, []);

  // Load product for edit
  // src/components/ProductForm.tsx - Update useEffect
useEffect(() => {
  if (productId) {
    axios.get<Product>(`/api/products/${productId}`)
      .then(r => {
        const p = r.data;
        setForm({
          partNumber: p.partNumber || '',
          partName: p.partName || '',
          materialId: p.material?.materialID?.toString() || '',
          colorantId: p.colorant?.colorantID?.toString() || '',
          moldId: p.mold?.moldID?.toString() || '',
          batchSize: p.batchSize?.toString() || '',
          note: p.note || '',
          boxSize: p.boxSize || '',
          fullBoxQty: p.fullBoxQty?.toString() || '',
          imagePath: p.imagePath || '',
          moldPath: p.moldPath || '',
          cavities: p.cavities?.toString() || '',
          insertId: p.insertId?.toString() || '',
          binId: p.binId || '',
          unitPrice: p.unitPrice?.toString() || '',
          description: p.description || ''
        });
        setSelectedAdditives(p.additives?.map(a => ({
          id: a.additiveID,
          pct: a.percentage.toString()
        })) || []);
      })
      .catch(() => toast.error('Load failed'));
  }
}, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      partNumber: form.partNumber,
      partName: form.partName,
      materialID: form.materialId ? +form.materialId : null,
      colorantID: form.colorantId ? +form.colorantId : null,
      moldId: form.moldId ? +form.moldId : null,
      batchSize: +form.batchSize || 0,
      note: form.note,
      boxSize: form.boxSize,
      fullBoxQty: +form.fullBoxQty || 0,
      imagePath: form.imagePath,
      moldPath: form.moldPath,
      cavities: +form.cavities || 0,
      insertId: form.insertId ? +form.insertId : null,
      binId: form.binId || null,
      unitPrice: parseFloat(form.unitPrice) || 0,
      description: form.description,
      additives: selectedAdditives
        .map(a => ({ additiveId: a.id, percentage: parseFloat(a.pct) || 0 }))
        .filter(a => a.percentage > 0)
    };

    try {
      if (productId) {
        await axios.put(`/api/products/${productId}`, payload);
        toast.success('Updated');
      } else {
        await axios.post('/api/products', payload);
        toast.success('Created');
      }
      onSuccess();
    } catch { toast.error('Save failed'); }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={gridContainer}>
        <div style={field}><label>Part Number *</label><input required value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} style={inputStyle} /></div>
        <div style={field}><label>Part Name *</label><input required value={form.partName} onChange={e => setForm({...form, partName: e.target.value})} style={inputStyle} /></div>

        <div style={field}><label>Material</label>
          <select value={form.materialId} onChange={e => setForm({...form, materialId: e.target.value})} style={selectStyle}>
            <option value="">No Material</option>
            {materials.map(m => <option key={m.materialID} value={m.materialID}>{m.name}</option>)}
          </select>
        </div>
        <div style={field}><label>Colorant</label>
          <select value={form.colorantId} onChange={e => setForm({...form, colorantId: e.target.value})} style={selectStyle}>
            <option value="">No Colorant</option>
            {colorants.map(c => <option key={c.colorantID} value={c.colorantID}>{c.name} ({c.code})</option>)}
          </select>
        </div>

        <div style={field}><label>Mold</label>
          <select value={form.moldId} onChange={e => setForm({...form, moldId: e.target.value})} style={selectStyle}>
            <option value="">No Mold</option>
            {molds.map(m => <option key={m.moldID} value={m.moldID}>{m.name}</option>)}
          </select>
        </div>
        <div style={field}><label>Cavities</label><input type="number" value={form.cavities} onChange={e => setForm({...form, cavities: e.target.value})} style={inputStyle} /></div>

        <div style={field}><label>Batch Size</label><input type="number" value={form.batchSize} onChange={e => setForm({...form, batchSize: e.target.value})} style={inputStyle} /></div>
        <div style={field}><label>Unit Price *</label><input type="number" step="0.01" required value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} style={inputStyle} /></div>

        <div style={field}><label>Box Size</label>
          <select value={form.boxSize} onChange={e => setForm({...form, boxSize: e.target.value})} style={selectStyle}>
            <option value="">Select</option>
            {BOX_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={field}><label>Full Box Qty</label><input type="number" value={form.fullBoxQty} onChange={e => setForm({...form, fullBoxQty: e.target.value})} style={inputStyle} /></div>

        <div style={field}><label>Insert ID</label><input type="number" value={form.insertId} onChange={e => setForm({...form, insertId: e.target.value})} style={inputStyle} /></div>
        <div style={field}><label>Bin ID</label><input value={form.binId} onChange={e => setForm({...form, binId: e.target.value})} style={inputStyle} /></div>

        {/* <div style={{...field, gridColumn: '1 / -1'}}><label>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} /></div> */}
        <div style={{...field, gridColumn: '1 / -1'}}><label>Note</label><textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} style={{...inputStyle, height: 80}} /></div>
        {/* <div style={{...field, gridColumn: '1 / -1'}}><label>Image Path</label><input value={form.imagePath} onChange={e => setForm({...form, imagePath: e.target.value})} style={inputStyle} /></div> */}
        {/* <div style={{...field, gridColumn: '1 / -1'}}><label>Mold Path</label><input value={form.moldPath} onChange={e => setForm({...form, moldPath: e.target.value})} style={inputStyle} /></div> */}
      </div>

      <div style={additivesSection}>
        <h4 style={{margin: '0 0 12px', color: '#0f0'}}>Additives</h4>
        {additives.map(a => {
          const sel = selectedAdditives.find(x => x.id === a.additiveID);
          return (
            <div key={a.additiveID} style={additiveRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={!!sel}
                  onChange={e => {
                    if (!e.target.checked) setSelectedAdditives(p => p.filter(x => x.id !== a.additiveID));
                    else setSelectedAdditives(p => [...p, {id: a.additiveID, pct: '0'}]);
                  }}
                />
                {a.name}
              </label>
              {sel && (
                <>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="%"
                    value={sel.pct}
                    onChange={e => setSelectedAdditives(p => p.map(x => x.id === a.additiveID ? {id: x.id, pct: e.target.value} : x))}
                    style={pctInput}
                  />
                  <div style={infoBox}>
                    <span style={ldrTag}>1:{(1/a.letDownRatio).toFixed(0)}</span>
                    <span style={priceTag}>${a.pricePerPound}/lb</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={buttonRow}>
        <button type="submit" style={btnStyle}>{productId ? 'Update' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
      </div>
    </form>
  );
}

// Styles unchanged
const formStyle: React.CSSProperties = { margin: '20px auto', maxWidth: 900, padding: 24, border: '1px solid #333', borderRadius: 12, background: '#111', color: '#fff', fontFamily: 'system-ui, sans-serif' };
const gridContainer: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 };
const field: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const inputStyle: React.CSSProperties = { padding: '8px 10px', background: '#222', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: '14px', marginTop: 4 };
const additivesSection: React.CSSProperties = { marginTop: 24, padding: 16, background: '#1a1a1a', borderRadius: 8, border: '1px solid #333' };
const additiveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', fontSize: '14px' };
const checkboxLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 140 };
const pctInput: React.CSSProperties = { width: 70, padding: '4px 6px', background: '#222', border: '1px solid #0f0', borderRadius: 4, color: '#0f0', fontSize: '13px' };
const infoBox: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', fontSize: '13px' };
const priceTag: React.CSSProperties = { color: '#0f0', background: '#1a3d1a', padding: '3px 8px', borderRadius: 6, fontWeight: 500, border: '1px solid #0f0' };
const ldrTag: React.CSSProperties = { color: '#0f0', background: '#1a3d1a', padding: '3px 8px', borderRadius: 6, fontWeight: 500, border: '1px solid #0f0' };
const buttonRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 };
const btnStyle: React.CSSProperties = { padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { ...btnStyle, background: '#444', color: '#fff' };
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '8px 10px',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230f0'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  backgroundSize: '12px'
};