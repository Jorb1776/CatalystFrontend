// src/components/InventorySection.tsx
import { InventoryItem } from '../types/Inventory';

interface InventorySectionProps {
  title: string;
  items: InventoryItem[];
  adjustQty: { [key: string]: string };
  setAdjustQty: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleAdjust: (item: InventoryItem) => void;
}

export const InventorySection = ({ title, items, adjustQty, setAdjustQty, handleAdjust }: InventorySectionProps) => {
  const getKey = (item: InventoryItem) => `${item.type}-${item.itemID}`;

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: '#0f0', margin: '0 0 12px', fontSize: '1.1rem' }}>{title}</h3>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {items.map(i => {
          const key = getKey(i);
          return (
            <div
              key={key}
              style={{
                border: '1px solid #444',
                borderRadius: 8,
                padding: 12,
                background: '#111',
                color: '#fff'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#0f0' }}>{i.name}</div>
              <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{i.type}</div>
              <div style={{ marginTop: 8 }}>
                <strong>{i.quantityOnHand.toFixed(2)} lbs</strong>
                {i.reorderLevel != null && i.quantityOnHand < i.reorderLevel && (
                  <span style={{ color: '#f00', marginLeft: 8 }}>LOW STOCK</span>
                )}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="± lbs"
                  value={adjustQty[key] || ''}
                  onChange={(e) => setAdjustQty(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdjust(i)}
                  style={{
                    width: 80,
                    padding: '4px 6px',
                    background: '#222',
                    color: '#0f0',
                    border: '1px solid #0f0',
                    borderRadius: 4,
                    fontSize: '0.8rem'
                  }}
                />
                <button
                  onClick={() => handleAdjust(i)}
                  style={{
                    background: '#0f0',
                    color: '#000',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};