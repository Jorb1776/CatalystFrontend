// src/pages/MoldToolPicturesUpload.tsx
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function MoldToolPicturesUpload() {
  const { moldId } = useParams<{ moldId: string }>();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const loadPhotos = () => {
    axios.get<{ files: string[] }>(`/api/moldfiles/${moldId}/tool-pictures`)
      .then(res => setPhotos(res.data.files || []))
      .catch(() => setPhotos([]));
  };

  useEffect(() => loadPhotos(), [moldId]);

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    try {
      await axios.post(`/api/moldfiles/${moldId}/tool-pictures`, formData);
      toast.success(`Uploaded ${files.length} picture${files.length > 1 ? 's' : ''}`);
      loadPhotos();
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const deletePhoto = async (file: string) => {
    if (!confirm(`Delete ${file}?`)) return;
    try {
      await axios.delete(`/api/moldfiles/${moldId}/tool-pictures/${file}`);
      toast.success('Deleted');
      loadPhotos();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 40, position: 'relative' }}>
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 20, left: 20, background: 'transparent', color: '#0f0', border: '1px solid #0f0', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
        ← Back
      </button>

      <h1 style={{ fontSize: '2rem', color: '#0f0', textAlign: 'center', marginBottom: 40 }}>
        Tool Pictures — Mold #{moldId}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 40 }}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
          style={{
            minHeight: 200,
            border: dragging ? '6px dashed #0f0' : '4px dashed #444',
            borderRadius: 24,
            background: dragging ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ fontSize: 45, opacity: dragging ? 1 : 0.6 }}>
            {dragging ? 'DROP' : 'DROP PHOTOS'}
          </div>
          <p style={{ color: dragging ? '#0f0' : '#888', marginTop: 20 }}>
            Multiple images • JPG / PNG
          </p>
        </div>

        {/* Gallery */}
        <div>
          {photos.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', fontSize: '1.2rem', marginTop: 100 }}>
              No photos yet
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {photos.map(file => (
                <div key={file} style={{ position: 'relative', border: '1px solid #333', borderRadius: 12, overflow: 'hidden' }}>
                  <img
                    src={`/api/moldfiles/${moldId}/tool-pictures/${file}`}
                    alt={file}
                    style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                    onClick={() => setSelected(`/api/moldfiles/${moldId}/tool-pictures/${file}`)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePhoto(file); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#f44', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <input id="fileInput" type="file" accept="image/*" multiple onChange={e => e.target.files && handleUpload(e.target.files)} style={{ display: 'none' }} />

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <img src={selected} alt=" enlarged" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
}