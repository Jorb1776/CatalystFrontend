// src/pages/MoldToolPicturesUpload.tsx
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface MoldInsert {
  moldInsertId: number;
  insertCode: string;
  fullNumber: string;
}

interface Mold {
  moldID: number;
  baseNumber: string;
  inserts: MoldInsert[];
}

export default function MoldToolPicturesUpload() {
  const { moldId } = useParams<{ moldId: string }>();
  const navigate = useNavigate();
  const [mold, setMold] = useState<Mold | null>(null);
  const [basePhotos, setBasePhotos] = useState<string[]>([]);
  const [insertPhotos, setInsertPhotos] = useState<Record<string, string[]>>({});
  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const loadMoldData = () => {
    axios.get<Mold>(`/api/Molds/${moldId}`)
      .then(res => setMold(res.data))
      .catch(() => toast.error('Failed to load mold'));
  };

  const loadBasePhotos = () => {
    axios.get<{ files: string[] }>(`/api/moldfiles/${moldId}/tool-pictures/base`)
      .then(res => setBasePhotos(res.data.files || []))
      .catch(() => setBasePhotos([]));
  };

  const loadInsertPhotos = (fullNumber: string) => {
    axios.get<{ files: string[] }>(`/api/moldfiles/${moldId}/tool-pictures/inserts/${fullNumber}`)
      .then(res => setInsertPhotos(prev => ({ ...prev, [fullNumber]: res.data.files || [] })))
      .catch(() => setInsertPhotos(prev => ({ ...prev, [fullNumber]: [] })));
  };

  useEffect(() => {
    loadMoldData();
    loadBasePhotos();
  }, [moldId]);

  useEffect(() => {
    if (mold?.inserts) {
      mold.inserts.forEach(insert => loadInsertPhotos(insert.fullNumber));
    }
  }, [mold]);

  const handleBaseUpload = async (files: FileList) => {
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    try {
      await axios.post(`/api/moldfiles/${moldId}/tool-pictures/base`, formData);
      toast.success(`Uploaded ${files.length} base photo${files.length > 1 ? 's' : ''}`);
      loadBasePhotos();
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleInsertUpload = async (fullNumber: string, files: FileList) => {
    if (!files.length) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    try {
      await axios.post(`/api/moldfiles/${moldId}/tool-pictures/inserts/${fullNumber}`, formData);
      toast.success(`Uploaded ${files.length} insert photo${files.length > 1 ? 's' : ''}`);
      loadInsertPhotos(fullNumber);
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent, fullNumber?: string) => {
    e.preventDefault();
    setDraggingSection(null);
    if (fullNumber) {
      handleInsertUpload(fullNumber, e.dataTransfer.files);
    } else {
      handleBaseUpload(e.dataTransfer.files);
    }
  };

  const deleteBasePhoto = async (file: string) => {
    if (!confirm(`Delete ${file}?`)) return;
    try {
      await axios.delete(`/api/moldfiles/${moldId}/tool-pictures/base/${file}`);
      toast.success('Deleted');
      loadBasePhotos();
    } catch {
      toast.error('Delete failed');
    }
  };

  const deleteInsertPhoto = async (fullNumber: string, file: string) => {
    if (!confirm(`Delete ${file}?`)) return;
    try {
      await axios.delete(`/api/moldfiles/${moldId}/tool-pictures/inserts/${fullNumber}/${file}`);
      toast.success('Deleted');
      loadInsertPhotos(fullNumber);
    } catch {
      toast.error('Delete failed');
    }
  };

  const PhotoSection = ({ title, photos, onUpload, onDelete, uploadUrl, sectionId }: {
    title: string;
    photos: string[];
    onUpload: (files: FileList) => void;
    onDelete: (file: string) => void;
    uploadUrl: (file: string) => string;
    sectionId: string;
  }) => {
    const isDragging = draggingSection === sectionId;

    return (
      <div style={{ marginBottom: 70 }}>
        <h2 style={{
          fontSize: '1.8rem',
          color: '#0f0',
          marginBottom: 24,
          borderBottom: '2px solid #0f0',
          paddingBottom: 12,
          fontWeight: 600
        }}>
          {title}
          <span style={{ color: '#aaa', fontSize: '1.2rem', fontWeight: 400, marginLeft: 12 }}>
            ({photos.length})
          </span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 40 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDraggingSection(sectionId); }}
            onDragLeave={() => setDraggingSection(null)}
            onDrop={e => handleDrop(e, sectionId === 'base' ? undefined : sectionId)}
            onClick={() => document.getElementById(`fileInput-${sectionId}`)?.click()}
            style={{
              minHeight: 200,
              border: isDragging ? '6px dashed #0f0' : '4px dashed #444',
              borderRadius: 24,
              background: isDragging ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ fontSize: 45, opacity: isDragging ? 1 : 0.6 }}>
              {isDragging ? 'DROP' : 'DROP PHOTOS'}
            </div>
            <p style={{ color: isDragging ? '#0f0' : '#888', marginTop: 20 }}>
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
                      src={uploadUrl(file)}
                      alt={file}
                      style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                      onClick={() => setSelected(uploadUrl(file))}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(file); }}
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

        <input
          id={`fileInput-${sectionId}`}
          type="file"
          accept="image/*"
          multiple
          onChange={e => e.target.files && onUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#fff',
      padding: '40px',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          color: '#0f0',
          border: '1px solid #0f0',
          padding: '10px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          marginBottom: 32,
          fontWeight: 'bold',
          fontSize: '15px'
        }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#0f0',
          margin: '0 0 8px 0',
          fontWeight: 600
        }}>
          Upload Tool Photos — Mold #{mold?.baseNumber || moldId}
        </h1>
        <p style={{ color: '#aaa', margin: 0, fontSize: '1.1rem' }}>
          Drag and drop photos or click to browse
        </p>
      </div>

      {/* Base Photos Section */}
      <PhotoSection
        title="Base Mold Photos"
        photos={basePhotos}
        onUpload={handleBaseUpload}
        onDelete={deleteBasePhoto}
        uploadUrl={(file) => `/api/moldfiles/${moldId}/tool-pictures/base/${file}`}
        sectionId="base"
      />

      {/* Insert Photos Sections */}
      {mold?.inserts.map(insert => (
        <PhotoSection
          key={insert.fullNumber}
          title={`Insert ${insert.fullNumber}`}
          photos={insertPhotos[insert.fullNumber] || []}
          onUpload={(files) => handleInsertUpload(insert.fullNumber, files)}
          onDelete={(file) => deleteInsertPhoto(insert.fullNumber, file)}
          uploadUrl={(file) => `/api/moldfiles/${moldId}/tool-pictures/inserts/${insert.fullNumber}/${file}`}
          sectionId={insert.fullNumber}
        />
      ))}

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <img src={selected} alt="enlarged" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
}