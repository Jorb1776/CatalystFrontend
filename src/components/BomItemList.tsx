// src/components/BomItemList.tsx
interface BomItem {
  ComponentID: number;
  ComponentName?: string;
  Quantity: number;
}

interface BomItemListProps {
  items: BomItem[];
  loading?: boolean;
}

export default function BomItemList({ items, loading }: BomItemListProps) {
  if (loading) return <p>Loading BOM items...</p>;

  return (
    <table style={tableStyle}>
      <thead>
        <tr style={thStyle}>
          <th>Component</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={2} style={tdStyle}>No components</td></tr>
        ) : (
          items.map((item, i) => (
        <tr key={i} style={trStyle}>
            <td style={tdStyle}>{item.ComponentName || item.ComponentID}</td> 
            <td style={tdStyle}>{item.Quantity}</td>                        
          </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 10 };
const thStyle: React.CSSProperties = { border: '1px solid #ccc', padding: 6, background: '#f8f8f8', fontSize: '14px' };
const trStyle: React.CSSProperties = { border: '1px solid #ddd' };
const tdStyle: React.CSSProperties = { padding: 6, border: '1px solid #ddd' };