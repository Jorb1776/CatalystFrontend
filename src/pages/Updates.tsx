// src/pages/Updates.tsx
import React, { useEffect, useMemo, useState } from "react";
import { UPDATES, UpdateCategory } from "../data/updates";

const CATEGORY_COLORS: Record<UpdateCategory, string> = {
  Feature: "#0f0",
  Improvement: "#0af",
  Fix: "#ff0",
  Security: "#f0f",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS) as UpdateCategory[];

const formatDate = (iso: string) => {
  // Parse as local time -- new Date("2026-08-22") is UTC midnight and can
  // display as the previous day in negative-offset timezones.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Updates() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [filter, setFilter] = useState<UpdateCategory | "All">("All");

  const entries = useMemo(() => {
    const sorted = [...UPDATES].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === "All") return sorted;
    return sorted
      .map((e) => ({ ...e, items: e.items.filter((i) => i.category === filter) }))
      .filter((e) => e.items.length > 0);
  }, [filter]);

  return (
    <div style={{ padding: isMobile ? 0 : "0 8px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ color: "#0f0", margin: 0, fontSize: isMobile ? "1.5rem" : "2rem" }}>
          What's New
        </h1>
        <p style={{ color: "#888", marginTop: 6, marginBottom: 0, fontSize: "0.9rem" }}>
          Recent changes to Catalyst, newest first.
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 26px" }}>
        {(["All", ...ALL_CATEGORIES] as const).map((c) => {
          const active = filter === c;
          const color = c === "All" ? "#0f0" : CATEGORY_COLORS[c as UpdateCategory];
          return (
            <button
              key={c}
              onClick={() => setFilter(c as UpdateCategory | "All")}
              style={{
                background: active ? color : "transparent",
                color: active ? "#000" : color,
                border: `1px solid ${color}`,
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
          No {filter.toLowerCase()} updates yet.
        </div>
      )}

      {entries.map((entry) => (
        <div
          key={entry.date + entry.title}
          style={{
            display: "flex",
            gap: isMobile ? 0 : 20,
            flexDirection: isMobile ? "column" : "row",
            marginBottom: 28,
          }}
        >
          {/* Date rail */}
          <div
            style={{
              minWidth: isMobile ? undefined : 150,
              paddingTop: isMobile ? 0 : 18,
              marginBottom: isMobile ? 8 : 0,
              textAlign: isMobile ? "left" : "right",
              color: "#0f0",
              fontSize: "0.85rem",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {formatDate(entry.date)}
          </div>

          {/* Card */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: "#1a1a1a",
              border: "1px solid #333",
              borderLeft: "3px solid #0f0",
              borderRadius: 12,
              padding: isMobile ? 16 : 20,
            }}
          >
            <h2 style={{ color: "#fff", margin: "0 0 14px", fontSize: "1.1rem" }}>
              {entry.title}
            </h2>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {entry.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      background: "transparent",
                      color: CATEGORY_COLORS[item.category],
                      border: `1px solid ${CATEGORY_COLORS[item.category]}`,
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      minWidth: isMobile ? undefined : 92,
                      textAlign: "center",
                    }}
                  >
                    {item.category}
                  </span>
                  <span style={{ color: "#ddd", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <div style={{ color: "#555", fontSize: "0.8rem", textAlign: "center", padding: "10px 0 30px" }}>
        Spotted a problem or have an idea? Use the Feedback button in the corner.
      </div>
    </div>
  );
}
