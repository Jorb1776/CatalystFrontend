// src/components/Login.js
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('https://localhost:7280/api/auth/login', {
        username: creds.username,
        password: creds.password
      });

      const { token, role } = res.data;

      // SAVE ONCE
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // CALL onLogin → triggers App.js useEffect
      onLogin();

      navigate('/products');
    } catch (err) {
      setError('Invalid username or password');
      console.error('Login failed:', err.response || err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2>Login</h2>
      <input
        placeholder="Username"
        value={creds.username}
        onChange={e => setCreds({ ...creds, username: e.target.value })}
        required
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={creds.password}
        onChange={e => setCreds({ ...creds, password: e.target.value })}
        required
        style={inputStyle}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" style={btn}>Login</button>
    </form>
  );
}

const formStyle = { maxWidth: 300, margin: '50px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 };
const inputStyle = { display: 'block', width: '100%', padding: 8, margin: '10px 0' };
const btn = { width: '100%', padding: 10, marginTop: 10 };