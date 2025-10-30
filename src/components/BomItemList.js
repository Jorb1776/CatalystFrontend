// src/components/BomItemList.js
export default function BomItemList({ items, loading }) {
    return loading ? <p>Loading BOM items...</p> : (
      <table style={tableStyle}>
        <thead>
          <tr style={thStyle}>
            <th>Component</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="2" style={tdStyle}>No components</td></tr>
          ) : (
            items.map((item, i) => (
              <tr key={i} style={trStyle}>
                <td style={tdStyle}>{item.componentID}</td> 
                <td style={tdStyle}>{item.componentName || 'Unknown'}</td>
                <td style={tdStyle}>{item.quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  }
  
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 10 };
  const thStyle = { border: '1px solid #ccc', padding: 6, background: '#f8f8f8', fontSize: '14px' };
  const trStyle = { border: '1px solid #ddd' };
  const tdStyle = { padding: 6, border: '1px solid #ddd' };