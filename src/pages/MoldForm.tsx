// src/pages/MoldForm.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "../axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

interface Mold {
  moldID: number;
  baseNumber: string;
  materialCompatibility: string;
  maintenanceSchedule: string;
}

const MoldForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    baseNumber: "",
    materialCompatibility: "",
    maintenanceSchedule: new Date().toISOString().slice(0, 16),
  });

  const [photos, setPhotos] = useState<string[]>([]);

  const deleteMold = async () => {
    if (!id || !confirm("Delete this mold permanently?")) return;
    try {
      await axios.delete(`/api/molds/${id}`);
      toast.success("Mold deleted");
      onSuccess();
      navigate("/molds");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      axios
        .get<Mold>(`/api/Molds/${id}`)
        .then((res) => {
          const m = res.data;
          setFormData({
            baseNumber: m.baseNumber,
            materialCompatibility: m.materialCompatibility || "",
            maintenanceSchedule: new Date(m.maintenanceSchedule)
              .toISOString()
              .slice(0, 16),
          });
        })
        .catch(() => {
          toast.error("Failed to load mold");
          navigate("/molds");
        });
    }
  }, [id, isEdit, navigate]);

  // Load tool pictures (base only for now)
  useEffect(() => {
    if (id) {
      axios
        .get<{ files: string[] }>(`/api/moldfiles/${id}/tool-pictures/base`)
        .then((res) => setPhotos(res.data.files || []))
        .catch(() => setPhotos([]));
    }
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && id) {
        await axios.put(`/api/Molds/${id}`, { moldID: +id, ...formData });
        toast.success("Mold updated");
      } else {
        await axios.post("/api/Molds", formData);
        toast.success("Mold created");
      }
      onSuccess();
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
        <h2 style={{ margin: "0 0 20px", color: "#0f0" }}>
          {isEdit ? "Edit" : "New"} Mold
        </h2>
        <div style={field}>
          <label style={labelStyle}>Base Mold Number *</label>
          <input
            name="baseNumber"
            value={formData.baseNumber}
            onChange={handleChange}
            placeholder="e.g. 102116"
            required
            style={inputStyle}
          />
        </div>

        {isEdit && id && (
          <div style={{ margin: "30px 0" }}>
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link to={`/molds/${id}/tool-pictures`}>
                <button
                  type="button"
                  style={{
                    background: "#0f0",
                    color: "#000",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                >
                  View Gallery
                </button>
              </Link>
              <Link to={`/molds/${id}/tool-pictures/upload`}>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    color: "#0f0",
                    padding: "12px 24px",
                    border: "2px solid #0f0",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                >
                  Upload Photos
                </button>
              </Link>
              <Link to={`/molds/${id}/tool-pictures/manage`}>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    color: "#0f0",
                    padding: "12px 24px",
                    border: "2px solid #0f0",
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                >
                  Manage Tags
                </button>
              </Link>

              <button
                type="button"
                onClick={deleteMold}
                style={{
                  background: "transparent",
                  color: "#d33",
                  border: "1px solid #d33",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: "bold",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                Delete Mold
              </button>
            </div>

            <h3 style={{ color: "#0f0", margin: "0 0 16px 0" }}>
              Tool Photos ({photos.length})
            </h3>

            {photos.length === 0 ? (
              <p style={{ color: "#aaa" }}>No photos yet</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {photos.map((file) => (
                  <img
                    key={file}
                    src={`/api/moldfiles/${id}/tool-pictures/base/${file}`}
                    alt={file}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 8,
                      border: "1px solid #333",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={buttonRow}>
          <button type="submit" style={btnStyle}>
            {isEdit ? "Update" : "Create"} Mold
          </button>
          <button
            type="button"
            onClick={() => navigate("/molds")}
            style={cancelBtn}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Styles unchanged...
const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "system-ui, sans-serif",
  } as const,
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 16,
  },
  error: { textAlign: "center" as const, padding: 40, color: "#fcc" },
};
const formStyle: React.CSSProperties = {
  /* ...same as before */
};
const gridContainer: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 24,
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column" };
const labelStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: "14px",
  fontWeight: 500,
  color: "#0f0",
};
const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "#222",
  border: "1px solid #444",
  borderRadius: 6,
  color: "#fff",
  fontSize: "14px",
};
const buttonRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 12,
};
const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#0f0",
  color: "#000",
  border: "none",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  ...btnStyle,
  background: "#444",
  color: "#fff",
};

export default MoldForm;
