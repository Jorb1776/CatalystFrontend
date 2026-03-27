import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const navigate = useNavigate();
  const { login, verify2FA, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login(username, password);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTempUsername(result.username || username);
        toast.success("Please enter your 2FA code");
        return;
      }

      toast.success("Logged in!");
      navigate("/floor");
    } catch (err: any) {
      toast.error("Invalid credentials");
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (twoFactorCode.length !== 6) {
      toast.error("Code must be 6 digits");
      return;
    }

    try {
      await verify2FA(tempUsername, twoFactorCode);
      toast.success("Logged in!");
      navigate("/floor");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid 2FA code");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "100px auto",
        padding: 32,
        background: "#111",
        borderRadius: 12,
        color: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#0f0" }}>Catalyst ERP</h2>

      {!requiresTwoFactor ? (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            autoFocus
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            disabled={isLoading}
          />
          <button type="submit" style={btnStyle} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <div>
          <p style={{ textAlign: "center", marginBottom: 24, color: "#aaa" }}>
            Enter the 6-digit code from your authenticator app
          </p>
          <form
            onSubmit={handleTwoFactorSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input
              type="text"
              placeholder="000000"
              value={twoFactorCode}
              onChange={(e) =>
                setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              style={{
                ...inputStyle,
                fontSize: "24px",
                letterSpacing: "8px",
                textAlign: "center",
              }}
              autoFocus
              maxLength={6}
              disabled={isLoading}
            />
            <button
              type="submit"
              style={btnStyle}
              disabled={twoFactorCode.length !== 6 || isLoading}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequiresTwoFactor(false);
                setTwoFactorCode("");
                setPassword("");
              }}
              style={{ ...btnStyle, background: "#444", color: "#fff" }}
              disabled={isLoading}
            >
              Back to Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  background: "#222",
  border: "1px solid #444",
  borderRadius: 8,
  color: "#fff",
  fontSize: "16px",
};

const btnStyle: React.CSSProperties = {
  padding: "14px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};
