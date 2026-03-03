import { useState, useEffect } from "react";

// ===== MOCK DATA =====
// In production, replace this with actual fetched data from calendar.8s8s.net
// Format: { date, weekday, lunar, monthPillar, dayPillar }
const MOCK_DATA = [
  { date: "2026/3/4",  weekday: "三", lunar: "正月十六", monthPillar: "庚寅", dayPillar: "丁丑" },
  { date: "2026/3/5",  weekday: "四", lunar: "正月十七", monthPillar: "庚寅", dayPillar: "戊寅" },
  { date: "2026/3/6",  weekday: "五", lunar: "正月十八", monthPillar: "辛卯", dayPillar: "己卯" },  // 月有辛
  { date: "2026/3/7",  weekday: "六", lunar: "正月十九", monthPillar: "辛卯", dayPillar: "庚辰" },  // 月有辛
  { date: "2026/3/8",  weekday: "日", lunar: "正月二十", monthPillar: "辛卯", dayPillar: "辛巳" },  // 月有辛, 日有辛+巳(火)
  { date: "2026/3/9",  weekday: "一", lunar: "正月廿一", monthPillar: "辛卯", dayPillar: "壬午" },  // 月有辛, 日有壬(水)+午(火)
  { date: "2026/3/10", weekday: "二", lunar: "正月廿二", monthPillar: "辛卯", dayPillar: "癸未" },  // 月有辛, 日有癸(水)
  // Extra entries to test edge cases:
  // { date: "test", weekday: "X", lunar: "測試", monthPillar: "辛酉", dayPillar: "丙午" }, // 辛酉強烈警告
];

// ===== COLOR LOGIC =====
const ALERT_CHARS = new Set(["辛", "酉"]);
const FIRE_CHARS = new Set(["丙", "丁", "巳", "午"]);
const WATER_CHARS = new Set(["壬", "癸", "亥", "子"]);

function classifyPillar(pillar) {
  // pillar is 2 chars like "庚寅"
  const [c1, c2] = pillar.split("");
  const has1 = ALERT_CHARS.has(c1);
  const has2 = ALERT_CHARS.has(c2);

  // Case: 辛酉 — both are alert chars → strong red
  if (has1 && has2) {
    return { type: "extreme", chars: [{ ch: c1, color: "extreme" }, { ch: c2, color: "extreme" }] };
  }

  // Case: one is alert
  if (has1 || has2) {
    const alertIdx = has1 ? 0 : 1;
    const otherIdx = alertIdx === 0 ? 1 : 0;
    const otherChar = [c1, c2][otherIdx];
    const alertChar = [c1, c2][alertIdx];

    let otherColor = "pink"; // default
    if (FIRE_CHARS.has(otherChar)) otherColor = "orange";
    else if (WATER_CHARS.has(otherChar)) otherColor = "purple";

    const result = [null, null];
    result[alertIdx] = { ch: alertChar, color: "pink" };
    result[otherIdx] = { ch: otherChar, color: otherColor };
    return { type: "alert", chars: result };
  }

  // No alert
  return { type: "none", chars: [{ ch: c1, color: "default" }, { ch: c2, color: "default" }] };
}

// ===== COLOR MAP =====
const COLOR_STYLES = {
  extreme: {
    bg: "rgba(220, 38, 38, 0.15)",
    text: "#dc2626",
    glow: "0 0 12px rgba(220, 38, 38, 0.5)",
    fontWeight: 800,
  },
  pink: {
    bg: "transparent",
    text: "#e11d48",
    glow: "none",
    fontWeight: 700,
  },
  orange: {
    bg: "transparent",
    text: "#ea580c",
    glow: "none",
    fontWeight: 700,
  },
  purple: {
    bg: "transparent",
    text: "#7c3aed",
    glow: "none",
    fontWeight: 700,
  },
  default: {
    bg: "transparent",
    text: "#64748b",
    glow: "none",
    fontWeight: 400,
  },
};

// ===== COMPONENTS =====

function PillarChar({ ch, colorKey }) {
  const s = COLOR_STYLES[colorKey] || COLOR_STYLES.default;
  return (
    <span
      style={{
        color: s.text,
        fontWeight: s.fontWeight,
        textShadow: s.glow,
        fontSize: "1.5rem",
        letterSpacing: "0.05em",
        transition: "all 0.3s ease",
      }}
    >
      {ch}
    </span>
  );
}

function PillarDisplay({ label, pillar }) {
  const analysis = classifyPillar(pillar);
  const isExtreme = analysis.type === "extreme";
  const isAlert = analysis.type === "alert" || isExtreme;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        background: isExtreme
          ? "rgba(220, 38, 38, 0.12)"
          : isAlert
          ? "rgba(225, 29, 72, 0.06)"
          : "rgba(100, 116, 139, 0.05)",
        border: isExtreme
          ? "2px solid rgba(220, 38, 38, 0.4)"
          : isAlert
          ? "1px solid rgba(225, 29, 72, 0.15)"
          : "1px solid rgba(100, 116, 139, 0.1)",
        transition: "all 0.3s ease",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          color: "#94a3b8",
          fontWeight: 500,
          minWidth: "1.2rem",
          fontFamily: "'Noto Sans TC', sans-serif",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: "0.15rem" }}>
        {analysis.chars.map((c, i) => (
          <PillarChar key={i} ch={c.ch} colorKey={c.color} />
        ))}
      </div>
      {isExtreme && (
        <span style={{ fontSize: "0.85rem", marginLeft: "0.2rem" }}>⚠️</span>
      )}
    </div>
  );
}

function DayCard({ data, isToday, animDelay }) {
  const monthAnalysis = classifyPillar(data.monthPillar);
  const dayAnalysis = classifyPillar(data.dayPillar);
  const hasAnyAlert =
    monthAnalysis.type !== "none" || dayAnalysis.type !== "none";
  const hasExtreme =
    monthAnalysis.type === "extreme" || dayAnalysis.type === "extreme";

  const dateParts = data.date.split("/");
  const displayDate = `${dateParts[1]}/${dateParts[2]}`;

  return (
    <div
      style={{
        flex: "1",
        minWidth: "130px",
        maxWidth: "180px",
        background: hasExtreme
          ? "linear-gradient(135deg, #1e1218 0%, #1a0a0e 100%)"
          : hasAnyAlert
          ? "linear-gradient(135deg, #1a1520 0%, #18101a 100%)"
          : "linear-gradient(135deg, #1a1d2e 0%, #151825 100%)",
        borderRadius: "16px",
        padding: "1.25rem 1rem",
        border: isToday
          ? "2px solid rgba(250, 204, 21, 0.5)"
          : hasExtreme
          ? "1px solid rgba(220, 38, 38, 0.25)"
          : "1px solid rgba(148, 163, 184, 0.08)",
        boxShadow: isToday
          ? "0 0 20px rgba(250, 204, 21, 0.1), inset 0 1px 0 rgba(255,255,255,0.03)"
          : hasExtreme
          ? "0 4px 24px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        animation: `fadeSlideUp 0.5s ease ${animDelay}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Today badge */}
      {isToday && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(250, 204, 21, 0.15)",
            color: "#facc15",
            fontSize: "0.6rem",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "99px",
            border: "1px solid rgba(250, 204, 21, 0.25)",
            fontFamily: "'Noto Sans TC', sans-serif",
          }}
        >
          TODAY
        </div>
      )}

      {/* Date header */}
      <div>
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 300,
            color: "#e2e8f0",
            fontFamily: "'Source Serif 4', serif",
            letterSpacing: "-0.02em",
          }}
        >
          {displayDate}
          <span
            style={{
              fontSize: "0.8rem",
              color: "#64748b",
              marginLeft: "0.35rem",
              fontFamily: "'Noto Sans TC', sans-serif",
              fontWeight: 400,
            }}
          >
            {data.weekday}
          </span>
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#475569",
            marginTop: "0.15rem",
            fontFamily: "'Noto Sans TC', sans-serif",
          }}
        >
          {data.lunar}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(148,163,184,0.12), transparent)",
        }}
      />

      {/* Pillars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <PillarDisplay label="月" pillar={data.monthPillar} />
        <PillarDisplay label="日" pillar={data.dayPillar} />
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: "#dc2626", label: "辛酉同柱（強烈警告）", symbol: "⚠️" },
    { color: "#e11d48", label: "含辛或酉" },
    { color: "#ea580c", label: "搭配丙丁巳午（火）" },
    { color: "#7c3aed", label: "搭配壬癸亥子（水）" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        justifyContent: "center",
        padding: "1rem 0",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            color: "#94a3b8",
            fontFamily: "'Noto Sans TC', sans-serif",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: item.color,
              display: "inline-block",
            }}
          />
          {item.symbol && <span style={{ fontSize: "0.7rem" }}>{item.symbol}</span>}
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ===== MAIN =====
export default function AlmanacDashboard() {
  // Use first 7 entries from mock data
  const days = MOCK_DATA.slice(0, 7);
  // Simulate "today" as the first entry
  const todayDate = days[0]?.date;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f1117 0%, #131620 40%, #0d0f16 100%)",
        padding: "2rem 1.5rem",
        fontFamily: "'Noto Sans TC', 'Source Serif 4', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Source+Serif+4:wght@300;400;600&display=swap');

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          animation: "fadeSlideUp 0.5s ease both",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 300,
            color: "#e2e8f0",
            letterSpacing: "0.15em",
            margin: 0,
            fontFamily: "'Source Serif 4', serif",
          }}
        >
          七日歲次總覽
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#475569",
            marginTop: "0.5rem",
            letterSpacing: "0.08em",
          }}
        >
          辛酉警戒監測
        </p>
      </div>

      {/* Cards container */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {days.map((d, i) => (
          <DayCard
            key={d.date}
            data={d}
            isToday={d.date === todayDate}
            animDelay={i * 0.08}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ maxWidth: "800px", margin: "2rem auto 0" }}>
        <Legend />
      </div>

      {/* Footer note */}
      <div
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.65rem",
          color: "#334155",
          letterSpacing: "0.05em",
        }}
      >
        資料來源：calendar.8s8s.net ｜ 以 Mock 資料展示，需接入爬蟲替換
      </div>
    </div>
  );
}
