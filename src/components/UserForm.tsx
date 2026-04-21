// src/components/UserForm.tsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface UserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form, setForm] = useState({ username: '', password: '', role: 'User' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get<{ username: string; role: string }>(`/api/users/${id}`)
        .then((res) => {
          setForm({ username: res.data.username, password: '', role: res.data.role });
          setLoading(false);
        })
        .catch(() => { toast.error("Failed to load user"); setLoading(false); });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { username: form.username, role: form.role };
    if (form.password) payload.password = form.password;

    try {
      if (isEdit) {
        const res = await axios.put(`/api/users/${id}`, payload);
        console.log("[UserForm] PUT response:", res.status, res.data);
        toast.success("User updated");
      } else {
        await axios.post('/api/users', payload);
        toast.success("User created");
      }
      onSuccess();
    } catch (err: any) {
      console.error("[UserForm] Error:", err?.response?.status, err?.response?.data);
      toast.error(err?.response?.data?.title || err?.response?.data?.message || "Save failed");
    }
  };

  if (loading) return <p style={{ color: "#888", textAlign: "center", padding: 40 }}>Loading...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ color: "#0f0", marginBottom: 24 }}>{isEdit ? "Edit User" : "New User"}</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Username</label>
          {isEdit ? (
            <div style={{ ...inputStyle, background: "#1a1a1a", color: "#888" }}>{form.username}</div>
          ) : (
            <input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              style={inputStyle}
            />
          )}
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>{isEdit ? "New Password (optional)" : "Password"}</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required={!isEdit}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Role</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            style={selectStyle}
          >
            <option value="User">User</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
          <button type="submit" style={submitBtn}>{isEdit ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}

const formStyle: React.CSSProperties = {
  padding: 24,
  background: "#111",
  border: "1px solid #333",
  borderRadius: 12,
};
const fieldStyle: React.CSSProperties = { marginBottom: 16 };
const labelStyle: React.CSSProperties = { display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 6,
  fontSize: "14px",
  boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230f0'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};
const submitBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px 20px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px 20px",
  background: "#444",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
