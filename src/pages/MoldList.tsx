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
  physicalLocation?: string;
}

const MoldList = () => {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [search, setSearch] = usePersistedSearch("moldSearch");
  const [locationFilter, setLocationFilter] = useState<"All" | "IN" | "TN">("All");
  const { location: globalLocation } = useLocation();
  const navigate = useNavigate();

  const loadMolds = async () => {
    try {
      const res = await axios.get<Mold[]>(`/api/molds`);
      setMolds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMolds();
  }, []);

  const filteredMolds = molds.filter((m) => {
    if (locationFilter !== "All" && m.physicalLocation !== locationFilter) return false;
    return m.baseNumber.toLowerCase().includes(search.toLowerCase());
  });

  const printReport = async () => {
    try {
      const params = locationFilter === "All" ? "" : `?location=${locationFilter}`;
      const res = await axios.get<{ moldID: number; baseNumber: string; physicalLocation?: string; partNumbers: string[] }[]>(
        `/api/molds/with-products${params}`
      );
      const term = search.toLowerCase();
      const data = res.data.filter(m => m.baseNumber.toLowerCase().includes(term));

      const locName = (loc?: string) => loc === "IN" ? "Indiana" : loc === "TN" ? "Tennessee" : (loc || "—");
      const locTitle = locationFilter === "All" ? "All Locations" : locName(locationFilter);
      const title = `Molds Report — ${locTitle}`;

      const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const rows = data.map(m => {
        const parts = m.partNumbers.length ? escape(m.partNumbers.join(", ")) : "—";
        const count = m.partNumbers.length;
        return `<tr><td>${escape(m.baseNumber)}</td><td>${locName(m.physicalLocation)}</td><td class="right">${count}</td><td>${parts}</td></tr>`;
      }).join("");

      const totalParts = data.reduce((s, m) => s + m.partNumbers.length, 0);
      const html = `<html><head><title>${title}</title><style>@page{margin:0.4in}body{font-family:Arial,sans-serif;margin:0;font-size:10px}h2{margin:0 0 2px;font-size:14px}p.date{color:#666;font-size:9px;margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1a6b1a;color:white;padding:3px 5px;text-align:left;font-size:9px}th.right{text-align:right}td{padding:3px 5px;border-bottom:1px solid #ddd;line-height:1.3;vertical-align:top}td.right{text-align:right}tr:nth-child(even){background:#f5f5f5}tfoot td{border-top:2px solid #333;font-weight:bold;background:#eee}</style></head><body><h2>${title}</h2><p class="date">Printed: ${new Date().toLocaleString()} | ${data.length} molds | ${totalParts} parts</p><table><thead><tr><th>Mold</th><th>Location</th><th class="right"># Parts</th><th>Part Numbers</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Total</td><td></td><td class="right">${totalParts}</td><td>${data.length} molds</td></tr></tfoot></table></body></html>`;

      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(html);
      w.document.close();
      w.print();
    } catch (err) {
      console.error(err);
      alert("Failed to load mold report");
    }
  };

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
          <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", width: 320 }}>
              <input
                type="text"
                placeholder="Search molds..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "12px 16px",
                  paddingRight: 36,
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: 8,
                  width: "100%",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: "18px",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["All", "IN", "TN"] as const).map(loc => {
                const active = locationFilter === loc;
                const isIN = loc === "IN";
                const isTN = loc === "TN";
                return (
                  <button key={loc} onClick={() => setLocationFilter(loc)}
                    style={{
                      background: active ? (isIN ? "#0f0" : isTN ? "#ff0" : "#0ff") : "transparent",
                      color: active ? "#000" : (isIN ? "#0f0" : isTN ? "#ff0" : "#0ff"),
                      border: "1px solid " + (isIN ? "#0f0" : isTN ? "#ff0" : "#0ff"),
                      padding: "10px 18px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: active ? "bold" : "normal",
                    }}>
                    {loc === "All" ? "All" : loc === "IN" ? "Indiana" : "Tennessee"}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={printReport}
              style={{
                background: "transparent",
                color: "#0f0",
                padding: "12px 20px",
                border: "1px solid #0f0",
                borderRadius: 8,
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Print
            </button>
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
                  {m.physicalLocation && (
                    <span style={{
                      background: m.physicalLocation === "IN" ? "#1a3d1a" : "#3d3d1a",
                      color: m.physicalLocation === "IN" ? "#0f0" : "#ff0",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: `1px solid ${m.physicalLocation === "IN" ? "#0f0" : "#ff0"}`,
                    }}>
                      {m.physicalLocation === "IN" ? "Indiana" : m.physicalLocation === "TN" ? "Tennessee" : m.physicalLocation}
                    </span>
                  )}
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
