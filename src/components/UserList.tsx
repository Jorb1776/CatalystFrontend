// src/components/UserList.tsx
interface User {
  id: number;
  username: string;
  role: string;
}

interface UserListProps {
  users: User[];
  loading: boolean;
  onEdit: (u: User) => void;
  onDelete: (id: number) => void;
}

export default function UserList({ users, loading, onEdit, onDelete }: UserListProps) {
  if (loading) return <p>Loading users...</p>;

  return (
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

// Add missing styles
const tableStyle: React.CSSProperties = { 
  width: '100%', 
  borderCollapse: 'collapse', 
  marginTop: 20 
};

const thStyle: React.CSSProperties = { 
  border: '1px solid #ccc', 
  padding: 8, 
  background: '#f0f0f0', 
  textAlign: 'left' 
};

const trStyle: React.CSSProperties = { 
  border: '1px solid #ddd' 
};

const tdStyle: React.CSSProperties = { 
  padding: 8, 
  border: '1px solid #ddd' 
};

const actionBtn: React.CSSProperties = { 
  margin: '0 4px', 
  padding: '4px 8px', 
  fontSize: '12px' 
};

const delBtn: React.CSSProperties = { 
  ...actionBtn, 
  background: '#fcc', 
  border: '1px solid #f99' 
};