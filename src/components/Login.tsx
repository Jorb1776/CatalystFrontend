import React, { useState } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LoginResponse } from '../types/Auth';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post<LoginResponse>('/api/auth/login', {
        username,
        password
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('role', res.data.role);

      toast.success('Logged in!');
      onLogin();
      navigate('/floor');
    } catch (err: any) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 32, background: '#111', borderRadius: 12, color: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#0f0' }}>Catalyst ERP</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        <button type="submit" style={btnStyle}>Login</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: '14px', color: '#aaa' }}>
        
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px',
  background: '#222',
  border: '1px solid #444',
  borderRadius: 8,
  color: '#fff',
  fontSize: '16px'
};

const btnStyle: React.CSSProperties = {
  padding: '14px',
  background: '#0f0',
  color: '#000',
  border: 'none',
  borderRadius: 8,
  fontWeight: 'bold',
  cursor: 'pointer'
};