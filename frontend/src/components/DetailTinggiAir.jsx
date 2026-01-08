import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AlertModal from './AlertModal';
import { getTMAStatus } from "../utils/status";

export default function DetailTinggiAir({ data, stationStatus }) {
  const chartData = Array.isArray(data?.chart) ? data.chart : [];

  const sortedRules = Array.isArray(data?.rules)
  ? [...data.rules].sort((a, b) => a.threshold - b.threshold)
  : [];

  const batasNormal = sortedRules.find(r => r.label === "Waspada");

  const getRuleColor = (label) => {
    if (label === "Bahaya") return "#e53e3e";
    if (label === "Waspada") return "#d97706";
    return "#38a169";
  };

  const getRangeText = (idx) => {
    if (!sortedRules[idx]) return "";

    const current = sortedRules[idx];
    const next = sortedRules[idx + 1];
    if (!next) {
      return `> ${current.threshold} m`;
    }
    return `${current.threshold} – ${next.threshold} m`;
  };


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
      <div className="white-card" style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
          <span
            style={{
              backgroundColor: stationStatus === "aktif" ? "#e6fffa" : "#fed7d7",
              color: stationStatus === "aktif" ? "#065f46" : "#9b2c2c",
              padding: "5px 15px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              border: `1px solid ${stationStatus === "aktif" ? "#38a169" : "#e53e3e"}`
            }}
          >
            {stationStatus === "aktif"
              ? "Alat Aktif"
              : "Tidak ada data 24 jam"}
          </span>
          <span className="badge-live">● Real-time</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "64px", margin: 0, fontWeight: "800", color: "#1a202c" }}>{data.last} m</h1>
            <p style={{ color: "#718096", margin: "5px 0" }}>Ketinggian Air Saat Ini</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: data.trend >= 0 ? "#e53e3e" : "#38a169", fontWeight: "bold", fontSize: "18px" }}>
              {trend >= 0 ? "📈 +" : "📉 "}{trend} m
              <p style={{ color: "#718096", margin: "5px 0",fontSize: "12px" }}>Dari Kemarin</p>
            </span>
            <p style={{ fontSize: "12px", color: "#a0aec0", margin: "5px 0 0 0" }}>Update: {data.last_time} WIB</p>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${safePercent}%`, backgroundColor: currentStatus.color }}></div>
        </div>
        <p style={{ marginTop: "10px", fontSize: "14px", fontWeight: "bold", color: currentStatus.color }}>
          {data.percent}% dari batas {batasNormal?.label ?? "Normal"} ({batasNormal?.threshold ?? "-"} m)
        </p>
      </div>

      <div className="white-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px" }}>
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
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: `conic-gradient(
                ${currentStatus.color} ${safePercent * 3.6}deg,
                ${currentStatus.bg} 0deg
              )`,
              position: "absolute"
            }}></div>

            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: "800",
              color: currentStatus.color,
              zIndex: 1
            }}>
              {safePercent}%
            </div>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {sortedRules.map((rule, idx) => (
              <div
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: getRuleColor(rule.label)
                  }}
                />
                {getRangeText(idx)} {rule.label}
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="white-card" style={{ padding: "25px", marginBottom: "40px" }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#2d3748" }}>Ketinggian Air 24 Jam Terakhir</h3>
        <div style={{ width: "100%", height: "350px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a8ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00a8ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 2.5]} tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {Array.isArray(data.rules) &&
                data.rules.map((rule, idx) => (
                  <ReferenceLine
                    key={idx}
                    y={rule.threshold}
                    stroke={getRuleColor(rule.label)}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `${rule.label.toUpperCase()} (${rule.threshold}m)`,
                      fill: getRuleColor(rule.label),
                      fontSize: 10,
                      position: "right",
                      fontWeight: "bold"
                    }}
                  />
              ))}
              <Area 
                type="monotone" 
                dataKey="water_level" 
                stroke="#00a8ff" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorLevel)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}