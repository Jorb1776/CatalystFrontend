import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AuthImage = React.memo(({ 
  photoPath, 
  alt = "Image", 
  style 
}: { 
  photoPath: string; 
  alt?: string; 
  style?: React.CSSProperties;
}) => {
  const [src, setSrc] = useState('/placeholder.jpg');

  useEffect(() => {
    if (!photoPath) {
      setSrc('/placeholder.jpg');
      return;
    }

    const fileName = photoPath.split('/').pop() || '';
    if (!fileName) return;

    let cancelled = false;

    axios.get(`/api/sampleapproval/photo/${fileName}`, { responseType: 'blob' })
      .then(res => {
        if (!cancelled) {
          setSrc(URL.createObjectURL(res.data as Blob));
        }
      })
      .catch(() => {
        if (!cancelled) setSrc('/placeholder.jpg');
      });

    return () => {
      cancelled = true;
      if (src !== '/placeholder.jpg') URL.revokeObjectURL(src);
    };
  }, [photoPath]);

  return <img src={src} alt={alt} style={style} loading="lazy" />;
});

export default AuthImage;