import { useState, useEffect } from "react";

// ===== COLOR LOGIC =====
const ALERT_CHARS = new Set(["辛", "酉"]);
const FIRE_CHARS = new Set(["丙", "丁", "巳", "午"]);
const WATER_CHARS = new Set(["壬", "癸", "亥", "子"]);

function classifyPillar(pillar) {
  const [c1, c2] = pillar.split("");
  const has1 = ALERT_CHARS.has(c1);
  const has2 = ALERT_CHARS.has(c2);

  // 辛酉同柱 → 強烈紅色警告
  if (has1 && has2) {
    return { type: "extreme", chars: [{ ch: c1, color: "extreme" }, { ch: c2, color: "extreme" }] };
  }

  // 其中一個是辛/酉
  if (has1 || has2) {
    const alertIdx = has1 ? 0 : 1;
    const otherIdx = alertIdx === 0 ? 1 : 0;
    const otherChar = [c1, c2][otherIdx];
    const alertChar = [c1, c2][alertIdx];

    let otherColor = "pink"; // 預設粉紅
    if (FIRE_CHARS.has(otherChar)) otherColor = "orange";
    else if (WATER_CHARS.has(otherChar)) otherColor = "purple";

    const result = [null, null];
    result[alertIdx] = { ch: alertChar, color: "pink" };
    result[otherIdx] = { ch: otherChar, color: otherColor };
    return { type: "alert", chars: result };
  }

  // 都沒有 → 不上色
  return { type: "none", chars: [{ ch: c1, color: "default" }, { ch: c2, color: "default" }] };
}

// ===== COLOR MAP =====
const COLOR_STYLES = {
  extreme: { bg: "rgba(220, 38, 38, 0.15)", text: "#dc2626", glow: "0 0 12px rgba(220, 38, 38, 0.5)", fontWeight: 800 },
  pink:    { bg: "transparent", text: "#e11d48", glow: "none", fontWeight: 700 },
  orange:  { bg: "transparent", text: "#ea580c", glow: "none", fontWeight: 700 },
  purple:  { bg: "transparent", text: "#7c3aed", glow: "none", fontWeight: 700 },
  default: { bg: "transparent", text: "#64748b", glow: "none", fontWeight: 400 },
};

// ===== MOCK DATA (fallback) =====
const MOCK_DATA = [
  { date: "2026/3/4",  weekday: "三", lunarDate: "二零二六年 正月(大) 十六", monthPillar: "庚寅", dayPillar: "丁丑" },
  { date: "2026/3/5",  weekday: "四", lunarDate: "二零二六年 正月(大) 十七", monthPillar: "庚寅", dayPillar: "戊寅" },
  { date: "2026/3/6",  weekday: "五", lunarDate: "二零二六年 正月(大) 十八", monthPillar: "辛卯", dayPillar: "己卯" },
  { date: "2026/3/7",  weekday: "六", lunarDate: "二零二六年 正月(大) 十九", monthPillar: "辛卯", dayPillar: "庚辰" },
  { date: "2026/3/8",  weekday: "日", lunarDate: "二零二六年 正月(大) 二十", monthPillar: "辛卯", dayPillar: "辛巳" },
  { date: "2026/3/9",  weekday: "一", lunarDate: "二零二六年 正月(大) 廿一", monthPillar: "辛卯", dayPillar: "壬午" },
  { date: "2026/3/10", weekday: "二", lunarDate: "二零二六年 正月(大) 廿二", monthPillar: "辛卯", dayPillar: "癸未" },
];

// ===== COMPONENTS =====

function PillarChar({ ch, colorKey }) {
  const s = COLOR_STYLES[colorKey] || COLOR_STYLES.default;
  return (
    <span style={{ color: s.text, fontWeight: s.fontWeight, textShadow: s.glow, fontSize: "1.5rem", letterSpacing: "0.05em", transition: "all 0.3s ease" }}>
      {ch}
    </span>
  );
}

function PillarDisplay({ label, pillar }) {
  const analysis = classifyPillar(pillar);
  const isExtreme = analysis.type === "extreme";
  const isAlert = analysis.type === "alert" || isExtreme;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      padding: "0.5rem 0.75rem", borderRadius: "8px",
      background: isExtreme ? "rgba(220, 38, 38, 0.12)" : isAlert ? "rgba(225, 29, 72, 0.06)" : "rgba(100, 116, 139, 0.05)",
      border: isExtreme ? "2px solid rgba(220, 38, 38, 0.4)" : isAlert ? "1px solid rgba(225, 29, 72, 0.15)" : "1px solid rgba(100, 116, 139, 0.1)",
      transition: "all 0.3s ease",
    }}>
      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500, minWidth: "1.2rem", fontFamily: "'Noto Sans TC', sans-serif" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: "0.15rem" }}>
        {analysis.chars.map((c, i) => (
          <PillarChar key={i} ch={c.ch} colorKey={c.color} />
        ))}
      </div>
      {isExtreme && <span style={{ fontSize: "0.85rem", marginLeft: "0.2rem" }}>⚠️</span>}
    </div>
  );
}

function DayCard({ data, isToday, animDelay }) {
  const monthAnalysis = classifyPillar(data.monthPillar);
  const dayAnalysis = classifyPillar(data.dayPillar);
  const hasAnyAlert = monthAnalysis.type !== "none" || dayAnalysis.type !== "none";
  const hasExtreme = monthAnalysis.type === "extreme" || dayAnalysis.type === "extreme";

  const dateParts = data.date.split("/");
  const displayDate = `${dateParts[1]}/${dateParts[2]}`;

  // 從農曆日期中擷取簡短顯示（例如「正月十六」）
  const lunarShort = data.lunarDate
    ? data.lunarDate.replace(/^.*年\s*/, '').replace(/[()（）]/g, '').replace(/大|小/, '').trim()
    : '';

  return (
    <div style={{
      flex: "1", minWidth: "130px", maxWidth: "180px",
      background: hasExtreme ? "linear-gradient(135deg, #1e1218 0%, #1a0a0e 100%)" : hasAnyAlert ? "linear-gradient(135deg, #1a1520 0%, #18101a 100%)" : "linear-gradient(135deg, #1a1d2e 0%, #151825 100%)",
      borderRadius: "16px", padding: "1.25rem 1rem",
      border: isToday ? "2px solid rgba(250, 204, 21, 0.5)" : hasExtreme ? "1px solid rgba(220, 38, 38, 0.25)" : "1px solid rgba(148, 163, 184, 0.08)",
      boxShadow: isToday ? "0 0 20px rgba(250, 204, 21, 0.1), inset 0 1px 0 rgba(255,255,255,0.03)" : hasExtreme ? "0 4px 24px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255,255,255,0.03)" : "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
      display: "flex", flexDirection: "column", gap: "0.75rem",
      animation: `fadeSlideUp 0.5s ease ${animDelay}s both`,
      position: "relative", overflow: "hidden",
    }}>
      {isToday && (
        <div style={{
          position: "absolute", top: "8px", right: "8px",
          background: "rgba(250, 204, 21, 0.15)", color: "#facc15",
          fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px",
          borderRadius: "99px", border: "1px solid rgba(250, 204, 21, 0.25)",
          fontFamily: "'Noto Sans TC', sans-serif",
        }}>
          TODAY
        </div>
      )}

      <div>
        <div style={{ fontSize: "1.4rem", fontWeight: 300, color: "#e2e8f0", fontFamily: "'Source Serif 4', serif", letterSpacing: "-0.02em" }}>
          {displayDate}
          <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "0.35rem", fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 400 }}>
            {data.weekday}
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.15rem", fontFamily: "'Noto Sans TC', sans-serif" }}>
          {lunarShort}
        </div>
      </div>

      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(148,163,184,0.12), transparent)" }} />

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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", padding: "1rem 0" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8", fontFamily: "'Noto Sans TC', sans-serif" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: item.color, display: "inline-block" }} />
          {item.symbol && <span style={{ fontSize: "0.7rem" }}>{item.symbol}</span>}
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ===== MAIN =====
export default function App() {
  const [days, setDays] = useState(MOCK_DATA);
  const [dataSource, setDataSource] = useState("mock");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // 嘗試從 almanac.json 讀取真實資料
    fetch(`${import.meta.env.BASE_URL}almanac.json`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (data.days && data.days.length > 0) {
          setDays(data.days);
          setDataSource("live");
          setLastUpdated(data.metadata?.lastUpdated || null);
          console.log("✅ 已載入 almanac.json 真實資料");
        }
      })
      .catch(() => {
        console.log("ℹ️  使用 Mock 資料（almanac.json 尚未就緒）");
      });
  }, []);

  // 判斷今天（台灣時間）
  const now = new Date();
  const twNow = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60 * 1000);
  const todayStr = `${twNow.getFullYear()}/${twNow.getMonth() + 1}/${twNow.getDate()}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f1117 0%, #131620 40%, #0d0f16 100%)",
      padding: "2rem 1.5rem",
      fontFamily: "'Noto Sans TC', 'Source Serif 4', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Source+Serif+4:wght@300;400;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem", animation: "fadeSlideUp 0.5s ease both" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 300, color: "#e2e8f0", letterSpacing: "0.15em", margin: 0, fontFamily: "'Source Serif 4', serif" }}>
          流月流日總覽
        </h1>
        <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.5rem", letterSpacing: "0.08em" }}>
          每日運勢參考
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", maxWidth: "1400px", margin: "0 auto" }}>
        {days.map((d, i) => (
          <DayCard key={d.date} data={d} isToday={d.date === todayStr} animDelay={i * 0.08} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ maxWidth: "800px", margin: "2rem auto 0" }}>
        <Legend />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.65rem", color: "#334155", letterSpacing: "0.05em" }}>
        資料來源：calendar.8s8s.net
        {dataSource === "mock" ? " ｜ 目前使用 Mock 資料" : ""}
        {lastUpdated ? ` ｜ 最後更新：${new Date(lastUpdated).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}` : ""}
      </div>
    </div>
  );
}
