// src/pages/MoldToolPicturesGallery.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';

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



export default function MoldToolPicturesGallery() {
  const { moldId } = useParams<{ moldId: string }>();
  const navigate = useNavigate();
  const [mold, setMold] = useState<Mold | null>(null);
  const [basePhotos, setBasePhotos] = useState<string[]>([]);
  const [insertPhotos, setInsertPhotos] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsedInserts, setCollapsedInserts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!moldId) return;

    // Load mold data
    axios.get<Mold>(`/api/Molds/${moldId}`)
      .then(res => {
        setMold(res.data);
        // Initialize all inserts as collapsed
        setCollapsedInserts(new Set(res.data.inserts.map(insert => insert.fullNumber)));
        // Load insert photos for each insert - use fullNumber as unique key
        res.data.inserts.forEach(insert => {
          axios.get<{ files: string[] }>(`/api/moldfiles/${moldId}/tool-pictures/inserts/${insert.fullNumber}`)
            .then(r => setInsertPhotos(prev => ({ ...prev, [insert.fullNumber]: r.data.files || [] })))
            .catch(() => setInsertPhotos(prev => ({ ...prev, [insert.fullNumber]: [] })));
        });
      })
      .catch(() => toast.error('Failed to load mold'));

    // Load base photos
    axios.get<{ files: string[] }>(`/api/moldfiles/${moldId}/tool-pictures/base`)
      .then(res => setBasePhotos(res.data.files || []))
      .catch(() => setBasePhotos([]));
  }, [moldId]);

  const totalPhotos = basePhotos.length + Object.values(insertPhotos).reduce((sum, photos) => sum + photos.length, 0);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#0f0', margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 600 }}>
          Tool Pictures — Mold #{mold?.baseNumber || moldId}
        </h1>
        <p style={{ color: '#aaa', margin: 0, fontSize: '1.1rem' }}>
          {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'} total
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <Link to={`/molds/${moldId}/tool-pictures/upload`}>
          <button style={{
            background: '#0f0',
            color: '#000',
            padding: '12px 24px',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '15px'
          }}>
            Upload Base Photos
          </button>
        </Link>
        <Link to={`/molds/${moldId}/tool-pictures/manage`}>
          <button style={{
            background: 'transparent',
            color: '#0f0',
            padding: '12px 24px',
            border: '1px solid #0f0',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '15px'
          }}>
            Manage Photo Tags
          </button>
        </Link>
      </div>

      {totalPhotos === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid #333'
        }}>
          <p style={{ color: '#aaa', fontSize: '1.2rem', margin: 0 }}>
            No tool pictures uploaded yet
          </p>
          <p style={{ color: '#666', fontSize: '0.95rem', marginTop: 12 }}>
            Upload base photos or add insert photos to get started
          </p>
        </div>
      ) : (
        <>
          {/* Base Photos Section */}
          {basePhotos.length > 0 && (
            <div style={{ marginBottom: 60 }}>
              <h2 style={{
                color: '#0f0',
                fontSize: '1.8rem',
                marginBottom: 24,
                borderBottom: '2px solid #0f0',
                paddingBottom: 12,
                fontWeight: 600
              }}>
                Base Mold Photos
                <span style={{ color: '#aaa', fontSize: '1.2rem', fontWeight: 400, marginLeft: 12 }}>
                  ({basePhotos.length})
                </span>
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}>
                {basePhotos.map((img, i) => (
                  <img
                    key={i}
                    src={`/api/moldfiles/${moldId}/tool-pictures/base/${img}`}
                    alt={`Base photo ${i + 1}`}
                    onClick={() => setSelected(`/api/moldfiles/${moldId}/tool-pictures/base/${img}`)}
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
            </div>
          )}

          {/* Insert Photos Sections */}
          {mold?.inserts.map(insert => {
            const photos = insertPhotos[insert.fullNumber] || [];
            if (photos.length === 0) return null;

            const isCollapsed = collapsedInserts.has(insert.fullNumber);

            return (
              <div key={insert.fullNumber} style={{ marginBottom: 50 }}>
                <h2
                  onClick={() => {
                    setCollapsedInserts(prev => {
                      const next = new Set(prev);
                      if (next.has(insert.fullNumber)) {
                        next.delete(insert.fullNumber);
                      } else {
                        next.add(insert.fullNumber);
                      }
                      return next;
                    });
                  }}
                  style={{
                    color: '#0f0',
                    fontSize: '1.8rem',
                    marginBottom: isCollapsed ? 0 : 24,
                    borderBottom: '2px solid #0f0',
                    paddingBottom: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <span>
                    Insert {insert.fullNumber}
                    <span style={{ color: '#aaa', fontSize: '1.2rem', fontWeight: 400, marginLeft: 12 }}>
                      ({photos.length})
                    </span>
                  </span>
                  <span style={{ fontSize: '1.2rem', color: '#0f0' }}>{isCollapsed ? '▶' : '▼'}</span>
                </h2>
                {!isCollapsed && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20,
                  }}>
                    {photos.map((img, i) => (
                      <img
                        key={i}
                        src={`/api/moldfiles/${moldId}/tool-pictures/inserts/${insert.fullNumber}/${img}`}
                        alt={`${insert.fullNumber} photo ${i + 1}`}
                        onClick={() => setSelected(`/api/moldfiles/${moldId}/tool-pictures/inserts/${insert.fullNumber}/${img}`)}
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
              </div>
            );
          })}
        </>
      )}

      {/* Lightbox */}
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
              cssText: `
                all: unset !important;
                display: block !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
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

const styles = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: 'system-ui, sans-serif',
    minHeight: '100vh'
  } as const,
  backBtn: {
    background: 'transparent',
    color: '#0f0',
    border: '1px solid #0f0',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 24,
    fontWeight: 'bold' as const,
    fontSize: '15px'
  },
  error: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#fcc'
  },
};


