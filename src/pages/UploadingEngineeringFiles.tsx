import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';
import { useState, useRef } from 'react';

export default function UploadingEngineeringFiles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const handleSingleUpload = async (type: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`/api/productfiles/${id}/${type}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success(`${type.replace(/-/g, ' ').toUpperCase()} uploaded!`);
      navigate(-1);
    } catch (err: any) {
      toast.error(err.response?.data || 'Upload failed');
    }
  };

  const handleToolPicturesUpload = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post(`/api/productfiles/${id}/tool-pictures`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success(`Uploaded ${files.length} tool picture${files.length > 1 ? 's' : ''}`);
      setTimeout(() => navigate(-1), 800);
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    setDragging(null);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    if (type === 'tool-pictures') {
      handleToolPicturesUpload(files);
    } else {
      handleSingleUpload(type, files[0]);
    }
  };

  const handleBatchDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(null);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    axios.post(`/api/productfiles/${id}/batch`, formData)
      .then(() => {
        toast.success(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
        setTimeout(() => navigate(-1), 1000);
      })
      .catch(() => toast.error('Batch upload failed'));
  };

  const zones = [
    { type: 'batch', label: 'BATCH UPLOAD', accept: '*', color: '#0f0', height: 180 },
    { type: '2d-cad', label: '2D DRAWING\n(PDF)', accept: '.pdf' },
    { type: '3d-cad', label: '3D CAD\n(STEP/STL/etc)', accept: '.step,.stp,.iges,.igs,.stl,.dxf,.dwg' },
    { type: 'setup-sheet', label: 'SETUP SHEET\n(PDF)', accept: '.pdf' },
    // Tool pictures → upload via Mold page
  ];

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: '#0f0', textAlign: 'center', marginBottom: 40 }}>
        Upload Engineering Files — Part #{id}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {zones.map(({ type, label, accept, color = '#0f0', height = 140 }) => (
          <div
            key={type}
            onDragOver={(e) => { e.preventDefault(); setDragging(type); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => type === 'batch' ? handleBatchDrop(e) : handleDrop(e, type)}
            onClick={() => type !== 'batch' && inputRefs.current.get(type)?.click()}
            style={{
              border: dragging === type ? `3px dashed ${color}` : '2px dashed #444',
              borderRadius: 16,
              height,
              background: dragging === type ? 'rgba(0,255,0,0.08)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 20,
              transition: 'all 0.2s ease',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            <div style={{
              color: dragging === type ? color : '#aaa',
              fontWeight: 'bold',
              fontSize: type === 'batch' ? '1.4rem' : '1rem',
              whiteSpace: 'pre-line',
              marginBottom: 12,
            }}>
              {dragging === type ? 'DROP HERE' : label}
            </div>

            {type !== 'batch' && (
            <input
              ref={(el) => {
                if (el) {
                  inputRefs.current.set(type, el);
                } else {
                  inputRefs.current.delete(type);
                }
              }}
              type="file"
              accept={accept}
              multiple={type === 'tool-pictures'}
              onChange={(e) => {
                const files = e.target.files;
                if (!files?.length) return;
                if (type === 'tool-pictures') {
                  handleToolPicturesUpload(files);
                } else {
                  handleSingleUpload(type, files[0]);
                }
                e.target.value = '';
              }}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '14px 32px',
            background: '#0f0',
            color: '#000',
            border: 'none',
            borderRadius: 12,
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: 'pointer',
          }}
        >
          ← Back to Part
        </button>
      </div>
    </div>
  );
}