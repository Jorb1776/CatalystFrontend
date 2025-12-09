// src/pages/ToolPicturesGallery.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';

const styles = {
  backBtn: {
    background: 'transparent',
    color: '#0f0',
    border: '1px solid #0f0',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
};

export default function ToolPicturesGallery() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token') || '';
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5099';
    const url = `${base}/api/productfiles/${id}/tool-pictures${token ? '?token=' + token : ''}`;

    axios.get<{ files: string[] }>(url)
      .then(res => setImages(res.data.files || []))
      .catch(() => toast.error('Failed to load tool pictures'));
  }, [id]);

  const getImageUrl = (filename: string) => {
    const token = localStorage.getItem('token') || '';
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5099';
    return `${base}/api/productfiles/${id}/tool-pictures/${filename}${token ? '?token=' + token : ''}`;
  };

  return (
    <div style={{ padding: 20, background: '#000', minHeight: '100vh', color: '#fff' }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>
      <h1 style={{ color: '#0f0', margin: '30px 0' }}>Tool Pictures</h1>

      {images.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: 50 }}>No tool pictures uploaded yet.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img)}
              alt={`Tool picture ${i + 1}`}
              onClick={() => setSelected(getImageUrl(img))}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8,
                cursor: 'zoom-in',
                border: '2px solid #333',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#0f0'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#333'}
            />
          ))}
        </div>
      )}



{selected && (
  <div
    onClick={() => setSelected(null)}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.98)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    } as React.CSSProperties}
  >
    <img
      src={selected}
      alt="Full size"
      onClick={() => setSelected(null)}
      style={{ 
        // THIS IS THE NUCLEAR OPTION THAT WINS
        // React allows it — and it shows in inspector
        cssText: `
          all: unset !important;
          display: block !important;
          width: 100% !important;


          height: 100%  !important;
          object-fit: contain !important;
          box-shadow: 0 0 40px rgba(0,255,0,0.6) !important;
        `
      } as any}
    />
  </div>
)}



    </div>
  );
}