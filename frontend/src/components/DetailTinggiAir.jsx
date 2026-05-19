import React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { getTMAStatus } from "../utils/status";

export default function DetailTinggiAir({ data, stationStatus }) {
  // 1. Data Safety & Sorting
  // Filter out "Aman" — selalu dijadikan zona implisit (di bawah threshold pertama)
  const chartData = Array.isArray(data?.chart) ? data.chart : [];
  const sortedRules = Array.isArray(data?.rules)
    ? [...data.rules]
        .sort((a, b) => a.threshold - b.threshold)
        .filter(r => r.label !== "Aman")
    : [];

  // 2. Identifikasi Ambang Batas untuk Area Warna
  const ruleWaspada = sortedRules.find(r => r.label === "Waspada");
  const ruleSiaga   = sortedRules.find(r => r.label === "Siaga");
  const ruleBahaya  = sortedRules.find(r => r.label === "Bahaya");

  // 3. Setting Batas Atas Y-Axis (Paten agar garis Bahaya selalu muncul)
  const maxRuleValue = ruleBahaya ? ruleBahaya.threshold : 2.5;
  const yAxisMax = +(maxRuleValue + 0.5).toFixed(1);

  const getRuleColor = (label) => {
    if (label === "Bahaya")  return "#e53e3e";
    if (label === "Siaga")   return "#f97316";
    if (label === "Waspada") return "#d97706";
    return "#38a169";
  };

  const getRangeText = (idx) => {
    if (!sortedRules[idx]) return "";
    const current = sortedRules[idx];
    const next = sortedRules[idx + 1];
    if (!next) return `> ${current.threshold} m`;
    return `${current.threshold} – ${next.threshold} m`;
  };

  // 4. Hitung Trend 24 Jam
  let trend = 0;
  const INTERVAL_24H = 144;
  if (chartData.length > INTERVAL_24H) {
    const lastValue = chartData[chartData.length - 1].water_level;
    const prev24hValue = chartData[chartData.length - 1 - INTERVAL_24H].water_level;
    trend = +(lastValue - prev24hValue).toFixed(2);
  }

  const currentStatus = getTMAStatus(data.status);
  const safePercent = Math.max(0, Math.min(data.percent, 100));

  return (
    <div style={{ padding: "20px", backgroundColor: "#f4f7f6", height: "145vh", overflowY: "auto", boxSizing: "border-box" }}>
      
      {/* --- CARD RINGKASAN UTAMA --- */}
      <div className="white-card" style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
          <span style={{
              backgroundColor: stationStatus === "aktif" ? "#e6fffa" : "#fed7d7",
              color: stationStatus === "aktif" ? "#065f46" : "#9b2c2c",
              padding: "5px 15px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              border: `1px solid ${stationStatus === "aktif" ? "#38a169" : "#e53e3e"}`
            }}>
            {stationStatus === "aktif" ? "Alat Aktif" : "Tidak ada data 24 jam"}
          </span>
          <span className="badge-live">● Real-time</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "64px", margin: 0, fontWeight: "800", color: "#1a202c" }}>{data.last} m</h1>
            <p style={{ color: "#718096", margin: "5px 0" }}>Ketinggian Air Saat Ini</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: trend >= 0 ? "#e53e3e" : "#38a169", fontWeight: "bold", fontSize: "18px" }}>
              {trend >= 0 ? "📈 +" : "📉 "}{trend} m
              <p style={{ color: "#718096", margin: "5px 0", fontSize: "12px" }}>Dari Kemarin</p>
            </span>
            <p style={{ fontSize: "12px", color: "#a0aec0", margin: "5px 0 0 0" }}>Update: {data.last_time} WIB</p>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${safePercent}%`, backgroundColor: currentStatus.color }}></div>
        </div>
        <p style={{ marginTop: "10px", fontSize: "14px", fontWeight: "bold", color: currentStatus.color }}>
          {data.percent}% dari batas {ruleBahaya?.label ?? "Bahaya"} ({ruleBahaya?.threshold ?? "-"} m)
        </p>
      </div>

      {/* --- CARD STATUS & GAUGE --- */}
      <div className="white-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px", marginBottom: "20px" }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2d3748" }}>Status Ambang Batas</h4>
          <p style={{ fontSize: "14px", color: "#718096", lineHeight: "1.5" }}>
            Level air saat ini berada pada kategori <strong>{data.status}</strong>. <br/>
            Sistem memantau perubahan ketinggian secara intensif setiap 10 menit.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "50px" }}>
          <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: `conic-gradient(${currentStatus.color} ${safePercent * 3.6}deg, ${currentStatus.bg} 0deg)`,
              position: "absolute"
            }}></div>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", fontWeight: "800", color: currentStatus.color, zIndex: 1
            }}>
              {safePercent}%
            </div>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {/* Zona Aman: 0 sampai threshold Waspada */}
            {ruleWaspada && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#38a169" }} />
                0 – {ruleWaspada.threshold} m&nbsp; Aman
              </div>
            )}
            {sortedRules.map((rule, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: getRuleColor(rule.label) }} />
                {getRangeText(idx)} {rule.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CARD GRAFIK DENGAN KETERANGAN WARNA --- */}
      <div className="white-card" style={{ padding: "25px", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: "0", fontSize: "16px", color: "#2d3748" }}>Ketinggian Air 24 Jam Terakhir</h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#718096" }}>Monitor fluktuasi air berdasarkan zona bahaya.</p>
          </div>
          
          {/* Legend Mini untuk menunjukkan arti warna background */}
          <div style={{ display: "flex", gap: "15px", padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600", color: "#4a5568" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "rgba(56, 161, 105, 0.15)" }}></div> Aman
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600", color: "#4a5568" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "rgba(217, 119, 6, 0.15)" }}></div> Waspada
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600", color: "#4a5568" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "rgba(249, 115, 22, 0.15)" }}></div> Siaga
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "600", color: "#4a5568" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "rgba(229, 62, 62, 0.15)" }}></div> Bahaya
            </div>
          </div>
        </div>

        <div style={{ width: "100%", height: "400px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a8ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00a8ff" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, yAxisMax]} tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />

              {/* AREA BACKGROUND ZONA */}
              {ruleWaspada && (
                <ReferenceArea y1={0} y2={ruleWaspada.threshold} fill="rgba(56, 161, 105, 0.1)" stroke="none" />
              )}
              {ruleWaspada && ruleSiaga && (
                <ReferenceArea y1={ruleWaspada.threshold} y2={ruleSiaga.threshold} fill="rgba(217, 119, 6, 0.1)" stroke="none" />
              )}
              {ruleSiaga && ruleBahaya && (
                <ReferenceArea y1={ruleSiaga.threshold} y2={ruleBahaya.threshold} fill="rgba(249, 115, 22, 0.1)" stroke="none" />
              )}
              {ruleBahaya && (
                <ReferenceArea y1={ruleBahaya.threshold} y2={yAxisMax} fill="rgba(229, 62, 62, 0.1)" stroke="none" />
              )}

              {/* GARIS REFERENCE AMBANG BATAS */}
              {sortedRules.map((rule, idx) => (
                <ReferenceLine
                  key={idx}
                  y={rule.threshold}
                  stroke={getRuleColor(rule.label)}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  isFront={true}
                  label={{
                    value: `${rule.label.toUpperCase()} (${rule.threshold}m)`,
                    fill: getRuleColor(rule.label),
                    fontSize: 11,
                    position: "right",
                    fontWeight: "bold",
                    offset: 10
                  }}
                />
              ))}

              {/* DATA AIR UTAMA */}
              <Area 
                type="monotone" 
                dataKey="water_level" 
                stroke="#00a8ff" 
                strokeWidth={4} 
                fill="url(#colorLevel)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}