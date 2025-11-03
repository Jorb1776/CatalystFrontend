// src/components/UserForm.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';

interface User {
  id?: number;
  username: string;
  role: string;
}

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [form, setForm] = useState({ username: '', password: '', role: 'User' });

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, password: '', role: user.role });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { username: form.username, role: form.role };
    if (form.password) payload.password = form.password;

    const request = user
      ? axios.put(`https://localhost:7280/api/users/${user.id}`, payload)
      : axios.post('https://localhost:7280/api/users', payload);

    request.then(() => onSuccess()).catch((err: any) => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        placeholder="Username"
        value={form.username}
        onChange={e => setForm({ ...form, username: e.target.value })}
        required
        style={inputStyle}
      />
      <input
        type="password"
        placeholder={user ? "New Password (optional)" : "Password"}
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
        required={!user}
        style={inputStyle}
      />
      <select
        value={form.role}
        onChange={e => setForm({ ...form, role: e.target.value })}
        style={inputStyle}
      >
        <option value="User">User</option>
        <option value="Manager">Manager</option>
        <option value="Admin">Admin</option>
      </select>
      <button type="submit" style={btnStyle}>{user ? 'Update' : 'Create'}</button>
      <button type="button" onClick={onCancel} style={btnStyle}>Cancel</button>
    </form>
  );
}

const formStyle = { margin: '20px 0', padding: 15, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle = { display: 'block', margin: '10px 0', padding: 8, width: '100%', maxWidth: 400 };
const btnStyle = { margin: '0 5px', padding: '8px 16px' };