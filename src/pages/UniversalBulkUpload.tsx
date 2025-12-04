// src/pages/UniversalBulkUpload.tsx
import React, { useState } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const backBtn: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  left: 20,
  background: 'transparent',
  color: '#0f0',
  border: '1px solid #0f0',
  padding: '10px 20px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  zIndex: 10,
};

export default function UniversalBulkUpload() {
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();

const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setDragging(false);

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  const validFiles: File[] = [];
  const invalidFiles: string[] = [];

  const formData = new FormData();

  files.forEach(file => {
    const name = file.name;
    const partNumber = name.split('.').slice(0, -1).join('.').trim();

    if (partNumber && /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/i.test(partNumber) && partNumber.length >= 3) {
      validFiles.push(file);
      formData.append('files', file);
    } else {
      invalidFiles.push(name);
    }
  });

  if (validFiles.length === 0) {
    toast.error(
      <div style={{ lineHeight: '1.5' }}>
        <strong>No valid part numbers found!</strong><br />
        <small>Examples of good names:</small><br />
        <code style={{ color: '#0f0' }}>4080.pdf  •  PLA1043.step  •  753-B.zip</code>
      </div>,
      { duration: 10000 }
    );
    return;
  }

  if (invalidFiles.length > 0) {
    toast.error(
      <div>
        <strong>Skipped {invalidFiles.length} file{invalidFiles.length > 1 ? 's' : ''} — bad name:</strong><br />
        {invalidFiles.slice(0, 6).map(f => <div key={f}>• {f}</div>)}
        {invalidFiles.length > 6 && <div>...and {invalidFiles.length - 6} more</div>}
      </div>,
      { duration: 8000 }
    );
  }

  try {
    toast.loading(`Uploading ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}...`, { id: 'upload' });
    await axios.post('/api/productfiles/batch', formData);  
    toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} routed perfectly!`, { id: 'upload' });
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Upload failed. Please check file name', { id: 'upload' });
  }
};

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 20,
        position: 'relative',
      }}
    >
      <button onClick={() => navigate(-1)} style={backBtn}>
        ← Back
      </button>

      <h1 style={{ fontSize: '2rem', color: '#0f0', marginBottom: 20 }}>
        Universal File Drop
      </h1>

      <p style={{ fontSize: '1.4rem', color: '#aaa', marginBottom: 40, textAlign: 'center', maxWidth: 800 }}>
        Just name your files with the part number and drop them here<br />
        <strong style={{ color: '#0f0' }}>4080.pdf • 753-B.pdf • PLA1043.step • etc.</strong>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
        style={{
          width: '90%',
          maxWidth: 900,
          minHeight: 400,
          border: dragging ? '6px dashed #0f0' : '4px dashed #444',
          borderRadius: 24,
          background: dragging ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ fontSize: 45, marginBottom: 20, opacity: dragging ? 1 : 0.6 }}>
          {dragging ? 'DROP IT' : 'DROP FILES HERE'}
        </div>

        <p style={{ fontSize: '1.1rem', color: dragging ? '#0f0' : '#888' }}>
          {dragging ? 'Release to upload' : 'PDF → 2D CAD • STEP/STL → 3D CAD • ZIP → Tooling'}
        </p>
      </div>

      <div style={{ marginTop: 40, color: '#666', fontSize: '1.1rem' }}>
        Files are automatically routed by part number in the filename
      </div>
    </div>
  );
}