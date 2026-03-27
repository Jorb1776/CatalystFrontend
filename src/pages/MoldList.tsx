// src/pages/MoldList.tsx
import React, { useState, useEffect } from "react";
import axios from "../axios";
import { Link, useNavigate } from "react-router-dom";
import { usePersistedSearch } from "../hooks/usePersistedSearch";
import { useLocation } from "../context/AuthContext";

interface Mold {
  moldID: number;
  baseNumber: string;
  materialCompatibility: string;
  maintenanceSchedule: string;
}

const MoldList = () => {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [search, setSearch] = usePersistedSearch("moldSearch");
  const { location: globalLocation } = useLocation();
  const navigate = useNavigate();

  const loadMolds = async () => {
    try {
      const params = globalLocation && globalLocation !== 'All' ? `?location=${globalLocation}` : "";
      const res = await axios.get<Mold[]>(`/api/molds${params}`);
      setMolds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMolds();
  }, [globalLocation]);

  const filteredMolds = molds.filter((m) =>
    m.baseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>
      <div style={{ padding: 20 }}>
        <h2
          style={{
            color: "#0f0",
            margin: "0 0 24px 0",
            fontSize: "2rem",
            fontWeight: 600,
          }}
        >
          Molds
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <input
            type="text"
            placeholder="Search molds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "12px 16px",
              background: "#222",
              color: "#fff",
              border: "1px solid #444",
              borderRadius: 8,
              width: 320,
              fontSize: "15px",
            }}
          />

          <Link to="/molds/new">
            <button
              style={{
                background: "#0f0",
                color: "#000",
                padding: "12px 24px",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              + New Mold
            </button>
          </Link>
        </div>
        {filteredMolds.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#1a1a1a",
              borderRadius: 12,
              border: "1px solid #333",
            }}
          >
            <p style={{ color: "#aaa", fontSize: "1.2rem", margin: 0 }}>
              {search ? "No molds found" : "No molds yet"}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {filteredMolds.map((m) => (
              <div
                key={m.moldID}
                style={{
                  background: "#222",
                  padding: 20,
                  borderRadius: 12,
                  color: "#fff",
                  border: "1px solid #333",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    padding: "4px 0",
                  }}
                >
                  <div
                    style={{
                      color: "#0f0",
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {m.baseNumber}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #333",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/molds/${m.moldID}/view`}
                    style={{ flex: 1, minWidth: "120px" }}
                  >
                    <button
                      style={{
                        width: "100%",
                        background: "#0f0",
                        color: "#000",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      View
                    </button>
                  </Link>
                  <Link
                    to={`/molds/${m.moldID}/tool-pictures`}
                    style={{ flex: 1, minWidth: "120px" }}
                  >
                    <button
                      style={{
                        width: "100%",
                        background: "transparent",
                        color: "#0f0",
                        border: "1px solid #0f0",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Tool Photos
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoldList;

const styles = {
  container: {
    margin: "0 auto",
    padding: "24px 20px",
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
};
