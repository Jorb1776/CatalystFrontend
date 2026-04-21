// src/components/UserList.tsx
import React from "react";

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
  if (loading) return <p style={{ color: "#888", textAlign: "center", padding: 40 }}>Loading users...</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#0f0", margin: 0, fontSize: "2rem", fontWeight: 600 }}>Users</h2>
        <button
          onClick={() => window.location.href = "/users/new"}
          style={{
            background: "#0f0",
            color: "#000",
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          + New User
        </button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {users.map(u => (
          <div key={u.id} style={{
            background: "#222",
            border: "1px solid #333",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#0f0", fontSize: "1.2rem", fontWeight: "bold" }}>{u.username}</span>
              <span style={{
                background: u.role === "Admin" ? "#3d1a1a" : u.role === "Manager" ? "#3d3d1a" : "#1a1a3d",
                color: u.role === "Admin" ? "#f44" : u.role === "Manager" ? "#ff0" : "#88f",
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: "0.75rem",
                fontWeight: "bold",
                border: `1px solid ${u.role === "Admin" ? "#f44" : u.role === "Manager" ? "#ff0" : "#88f"}`,
              }}>
                {u.role}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid #333", paddingTop: 12 }}>
              <button onClick={() => onEdit(u)} style={{
                flex: 1,
                background: "#0f0",
                color: "#000",
                border: "none",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: "bold",
              }}>
                Edit
              </button>
              {u.role !== "Admin" && (
                <button onClick={() => onDelete(u.id)} style={{
                  flex: 1,
                  background: "transparent",
                  color: "#f44",
                  border: "1px solid #f44",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
