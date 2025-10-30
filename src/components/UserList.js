// src/components/UserList.js
export default function UserList({ users, loading, onEdit, onDelete }) {
    return loading ? <p>Loading users...</p> : (
      <table style={tableStyle}>
        <thead>
          <tr style={thStyle}>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={trStyle}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.username}</td>
              <td style={tdStyle}>{u.role}</td>
              <td style={tdStyle}>
                <button onClick={() => onEdit(u)} style={actionBtn}>Edit</button>
                {u.role !== 'Admin' && (
                  <button onClick={() => onDelete(u.id)} style={delBtn}>Delete</button>
                )}
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