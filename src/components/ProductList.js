// src/components/ProductList.js
export default function ProductList({ products, loading, onEdit, onDelete }) {
    return loading ? <p>Loading...</p> : (
      <table style={tableStyle}>
        <thead>
          <tr style={thStyle}>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.productID} style={trStyle}>
              <td style={tdStyle}>{p.productID}</td>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>${p.unitPrice}</td>
              <td style={tdStyle}>
                <button onClick={() => onEdit(p)} style={actionBtn}>Edit</button>
                <button onClick={() => onDelete(p.productID)} style={delBtn}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
  const thStyle = { border: '1px solid #ccc', padding: 8, background: '#f0f0f0', textAlign: 'left' };
  const trStyle = { border: '1px solid #ddd' };
  const tdStyle = { padding: 8, border: '1px solid #ddd' };
  const actionBtn = { margin: '0 4px', padding: '4px 8px', fontSize: '12px' };
  const delBtn = { ...actionBtn, background: '#fcc', border: '1px solid #f99' };