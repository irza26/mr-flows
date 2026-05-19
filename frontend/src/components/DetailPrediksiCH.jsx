import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
// Import fungsi status buatanmu
import { getRainStatus } from "../utils/status";

// ICON (Raindrop Icon)
const RainIcon = ({ color }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    <path d="M8 13a4 4 0 0 0 8 0" />
  </svg>
);

export default function DetailPrediksiCH({ data }) {
  if (!data) return null;

  // 1. Ambil historis 2 jam terakhir
  const last2HoursData = (data.chart || []).slice(-12);
  const nowTime = last2HoursData[last2HoursData.length - 1]?.time;

  // 2. FILTER PREDIKSI: Hanya tampilkan data prediksi yang >= waktu sekarang
  // 🔥 helper (cukup 1x di atas)
  const parseTime = (t) => new Date(t.replace(" ", "T"));

  // 🔥 pakai waktu SEKARANG (bukan dari chart / DB)
  const nowDate = new Date();

  // 🔥 filter untuk chart (future only)
  let futurePrediction = (data.prediction_chart || []).filter(d => {
    return parseTime(d.time) > nowDate;
  });

  // fallback biar gak kosong
  if (futurePrediction.length === 0) {
    futurePrediction = data.prediction_chart || [];
  }

  // 🔥 ambil prediksi TERDEKAT (bukan terakhir)
  const nearestPred =
    (data.prediction_chart || []).find(p =>
      parseTime(p.time) > nowDate
    ) || data.prediction_chart?.[0];

  // 🔥 ini yang dipakai di UI (TIDAK USAH ubah tampilan)
  const lastPredVal = nearestPred?.rain ?? 0;
  // 3. Gabungkan untuk Chart
  const chartData = [
    ...last2HoursData.map(d => ({
      time: d.time,
      actual: d.rain_fall
    })),
    ...futurePrediction.map(d => ({
      time: d.time,
      prediction: d.rain
    }))
  ];

  // Pakai fungsi status dari utils/status.js
  const rainStatus = getRainStatus(lastPredVal);
  const brandBlue = "#0ea5e9";

  // Batas atas Y-Axis (Paten)
  const maxVal = Math.max(...chartData.flatMap(d => [d.actual || 0, d.prediction || 0]), 10);
  const yAxisMax = +(maxVal + 5).toFixed(0);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "20px",
      border: "1px solid #f1f5f9",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      overflow: "hidden"
    }}>

      {/* HEADER */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: brandBlue }}></div>
        <b style={{ color: "#1e293b", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>WRF Forecast System</b>
      </div>

      {/* HERO SECTION */}
      <div style={{ padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom right, #ffffff, #f8fafc)" }}>
        <div>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: "4px", fontWeight: "500" }}>Prediksi Curah Hujan (WRF)</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <h1 style={{ fontSize: 72, margin: 0, fontWeight: "800", color: "#0f172a", letterSpacing: "-3px" }}>
              {lastPredVal.toFixed(2)}
            </h1>
            <span style={{ fontSize: "24px", fontWeight: "600", color: "#64748b" }}>mm</span>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" }}>
            <div style={{
              backgroundColor: rainStatus.color,
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase"
            }}>
              {rainStatus.emoji} {rainStatus.label}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>MODEL PREDIKSI</p>
          <h3 style={{ margin: "4px 0 12px 0", fontSize: "28px", fontWeight: "700", color: "#1e293b" }}>WRF-9km</h3>
          <div style={{ display: "inline-flex", padding: "10px", backgroundColor: rainStatus.bg, borderRadius: "12px" }}>
            <RainIcon color={rainStatus.color} />
          </div>
        </div>
      </div>

      {/* CHART HEADER */}
      <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Trend Historis (2 Jam) & Estimasi Kedepan</h4>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "bold", color: "#94a3b8" }}>
            <div style={{ width: "12px", height: "3px", backgroundColor: brandBlue }}></div> AKTUAL
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "bold", color: "#94a3b8" }}>
            <div style={{ width: "12px", height: "3px", borderTop: "2px dashed #f97316" }}></div> PREDIKSI
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div style={{ padding: "16px 24px 24px 24px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <YAxis domain={[0, yAxisMax]} tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />

            {nowTime && (
              <ReferenceLine 
                x={nowTime} 
                stroke="#64748b" 
                strokeWidth={1} 
                label={{ value: 'NOW', position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
            )}

            <Area
              type="monotone"
              dataKey="actual"
              stroke={brandBlue}
              fill={brandBlue}
              fillOpacity={0.1}
              strokeWidth={3}
              isAnimationActive={false}
            />

            <Area
              type="monotone"
              dataKey="prediction"
              stroke="#f97316"
              strokeDasharray="8 4"
              fillOpacity={0}
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* INSIGHT BOX */}
      <div style={{
        margin: "0 24px 24px",
        padding: "16px 20px",
        background: rainStatus.bg,
        borderRadius: "16px",
        border: `1px solid ${rainStatus.border}`,
        display: "flex",
        alignItems: "flex-start",
        gap: "16px"
      }}>
        <div style={{ 
            fontSize: "24px", 
            width: "44px", 
            height: "44px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            backgroundColor: "#fff", 
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
            {rainStatus.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h5 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "14px", fontWeight: "700" }}>
            Analisis Cuaca: <span style={{ color: rainStatus.color }}>{rainStatus.desc}</span>
          </h5>
          <p style={{ margin: 0, fontSize: "13px", color: "#4a5568", lineHeight: "1.6" }}>
             Estimasi curah hujan kedepan berada pada level <b>{lastPredVal.toFixed(2)} mm</b>. Tetap pantau kondisi sekitar.
          </p>
        </div>
      </div>

    </div>
  );
}