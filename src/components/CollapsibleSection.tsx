import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      marginBottom: '24px',
      border: '2px solid #00ff41',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0, 255, 65, 0.15)',
      transition: 'all 0.3s ease',
    }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 20px',
          backgroundColor: isOpen ? '#0a0a0a' : '#000',
          color: '#00ff41',
          border: 'none',
          borderBottom: isOpen ? '2px solid rgba(0, 255, 65, 0.3)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontWeight: 'bold',
          fontSize: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#0a0a0a';
          e.currentTarget.style.color = '#00ff88';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = isOpen ? '#0a0a0a' : '#000';
          e.currentTarget.style.color = '#00ff41';
        }}
      >
        <span>{title}</span>
        <span style={{
          fontSize: '14px',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>▼</span>
      </button>
      {isOpen && (
        <div style={{
          padding: '24px',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at top right, rgba(0, 255, 65, 0.03), transparent 50%)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
