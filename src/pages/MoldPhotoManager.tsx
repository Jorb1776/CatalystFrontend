// src/pages/MoldPhotoManager.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';

interface PhotoWithTags {
  fileName: string;
  tags: string[];
}

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

export default function MoldPhotoManager() {
  const { moldId } = useParams<{ moldId: string }>();
  const navigate = useNavigate();
  const [mold, setMold] = useState<Mold | null>(null);
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadData = () => {
    axios.get<Mold>(`/api/Molds/${moldId}`)
      .then(res => setMold(res.data))
      .catch(() => toast.error('Failed to load mold'));

    axios.get<PhotoWithTags[]>(`/api/moldfiles/${moldId}/photos/all-with-tags`)
      .then(res => setPhotos(res.data))
      .catch(() => toast.error('Failed to load photos'));
  };

  useEffect(() => loadData(), [moldId]);

  const tagPhoto = async (fileName: string, insertCode: string) => {
    try {
      await axios.post(`/api/moldfiles/${moldId}/photos/${fileName}/tag`, { insertCode });
      toast.success('Photo tagged');
      loadData();
    } catch {
      toast.error('Failed to tag photo');
    }
  };

  const untagPhoto = async (fileName: string, insertCode: string) => {
    try {
      await axios.delete(`/api/moldfiles/${moldId}/photos/${fileName}/tag/${insertCode}`);
      toast.success('Tag removed');
      loadData();
    } catch {
      toast.error('Failed to remove tag');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 40 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: '#0f0', border: '1px solid #0f0', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
        ← Back
      </button>

      <h1 style={{ fontSize: '2rem', color: '#0f0', textAlign: 'center', marginBottom: 40 }}>
        Manage Photo Tags — Mold #{mold?.baseNumber || moldId}
      </h1>

      {/* <div style={{ marginBottom: 30, padding: 20, background: '#111', borderRadius: 12, border: '1px solid #333' }}>
        <h3 style={{ color: '#0f0', marginBottom: 16 }}>Available Insert Codes:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {mold?.inserts.map(insert => (
            <span key={insert.insertCode} style={{ padding: '6px 12px', background: '#222', border: '1px solid #0f0', borderRadius: 6, fontSize: '0.9rem' }}>
              {insert.insertCode} ({insert.fullNumber})
            </span>
          ))}
        </div>
      </div> */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {photos.map(photo => (
          <div key={photo.fileName} style={{ border: '1px solid #333', borderRadius: 12, overflow: 'hidden', background: '#111' }}>
            <img
              src={`/api/moldfiles/${moldId}/tool-pictures/base/${photo.fileName}`}
              alt={photo.fileName}
              style={{ width: '100%', height: 350, objectFit: 'cover', cursor: 'zoom-in' }}
              onClick={() => setSelected(`/api/moldfiles/${moldId}/tool-pictures/base/${photo.fileName}`)}
            />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12, wordBreak: 'break-all' }}>{photo.fileName}</div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(2, 204, 2, 1)', marginBottom: 8 }}>Tagged as:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {photo.tags.length === 0 ? (
                    <span style={{ color: '#666', fontSize: '0.85rem' }}>No tags</span>
                  ) : (
                    photo.tags.map(tag => (
                      <span key={tag} style={{ padding: '4px 8px', background: 'rgba(2, 99, 2, 1)', color: '#000', borderRadius: 4, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {tag}
                        <button
                          onClick={() => untagPhoto(photo.fileName, tag)}
                          style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    tagPhoto(photo.fileName, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ width: '100%', padding: '8px', background: '#222', color: '#0f0', border: '1px solid #444', borderRadius: 6, cursor: 'pointer' }}
              >
                <option value="">+ Add tag...</option>
                {mold?.inserts
                  .filter(i => !photo.tags.includes(i.insertCode))
                  .sort((a, b) => a.insertCode.localeCompare(b.insertCode))
                  .map(insert => (
                    <option key={insert.insertCode} value={insert.insertCode}>
                      {insert.insertCode}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <img src={selected} alt="enlarged" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  );
}
