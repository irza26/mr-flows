import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";

// ICON
const ClockIcon = ({ color }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function DetailPrediksi({ data }) {
  const lastTime = data?.last_time;

  const estimatedTime = useMemo(() => {
    if (!lastTime) return "-";
    const base = new Date(lastTime);
    base.setMinutes(base.getMinutes() + 60);
    return base.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastTime]);

  if (!data) return null;

  const current = parseFloat(data.last || 0);
  const predictionSeries = data.prediction_series || [];

  const lastPredictionPoint =
    predictionSeries.length > 0
      ? predictionSeries[predictionSeries.length - 1]
      : null;

  const prediction = lastPredictionPoint
    ? lastPredictionPoint.water_level
    : data.prediction ?? 0;
  const isNaik = prediction > current;
  const delta = Math.abs(prediction - current).toFixed(2);
  const brandBlue = "#0ea5e9";

  // Ambil rules dan urutkan
  const sortedRules = Array.isArray(data?.rules)
    ? [...data.rules].sort((a, b) => a.threshold - b.threshold)
    : [];

  const ruleWaspada = sortedRules.find(r => r.label === "Waspada");
  const ruleSiaga = sortedRules.find(r => r.label === "Siaga" || r.label === "Bahaya");

  // Setting batas atas Y-Axis Paten
  const maxThreshold = ruleSiaga ? ruleSiaga.threshold : 2.5;
  const yAxisMax = +(maxThreshold + 0.5).toFixed(1);

  const getStatus = () => {
    if (sortedRules.length === 0) {
      return { label: "-", color: "#999", bg: "#eee", hint: "" };
    }

    let status = sortedRules[0];
    sortedRules.forEach(rule => {
      if (prediction >= rule.threshold) {
        status = rule;
      }
    });

    const colorMap = {
      "Aman": "#10b981",
      "Waspada": "#f59e0b",
      "Siaga": "#ef4444",
      "Bahaya": "#ef4444"
    };

    const hintMap = {
      "Aman": "Kondisi stabil",
      "Waspada": "Monitoring ketat diperlukan",
      "Siaga": "Potensi banjir tinggi",
      "Bahaya": "Evakuasi mungkin diperlukan"
    };

    return {
      label: status.label,
      color: colorMap[status.label] || brandBlue,
      bg: "#f8fafc",
      hint: hintMap[status.label] || ""
    };
  };

  const status = getStatus();
  const lastHourData = (data.chart || []).slice(-6);

  const chartData = [
    ...lastHourData.map(d => ({
      time: d.time,
      actual: d.water_level
    })),
    ...(data.prediction_series || []).map(d => ({
      time: d.time,
      prediction: d.water_level
    }))
  ];

  const nowTime = lastHourData[lastHourData.length - 1]?.time;

  return (
    <div style={{
      background: "#fff",
      borderRadius: "20px",
      border: "1px solid #f1f5f9",
      overflow: "hidden"
    }}>

      {/* HEADER */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <b style={{ color: brandBlue }}>AI Forecast System</b>
      </div>

      {/* HERO */}
      <div style={{ padding: "30px 24px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, color: "#64748b" }}>Prediksi TMA (1 Jam Kedepan)</p>
          <h1 style={{ fontSize: 72, margin: 0, fontWeight: "800", letterSpacing: "-2px" }}>
            {prediction.toFixed(2)} m
          </h1>
          <p style={{ color: isNaik ? "#ef4444" : "#10b981", fontWeight: "bold", marginTop: "5px" }}>
            {isNaik ? "⬆️ Estimasi Naik" : "⬇️ Estimasi Turun"} {delta} m
          </p>
          <div style={{
            background: status.color + "15",
            color: status.color,
            padding: "6px 12px",
            borderRadius: "12px",
            display: "inline-block",
            fontWeight: "bold",
            fontSize: "14px",
            marginTop: "10px",
            border: `1px solid ${status.color}30`
          }}>
            {status.label}
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: "5px" }}>Estimasi (Waktu Lokal)</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>{estimatedTime}</h3>
          <ClockIcon color={brandBlue} />
        </div>
      </div>

      {/* CHART HEADER DENGAN LEGEND */}
      <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>Trend Prediksi & Historis</h4>
        
        {/* Legend Warna Area */}
        <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "rgba(16, 185, 129, 0.1)" }}></div> Aman
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "rgba(245, 158, 11, 0.1)" }}></div> Waspada
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}></div> Siaga
          </div>
        </div>
      </div>

      {/* CHART UTAMA */}
      <div style={{ padding: "10px 24px 30px 24px" }}>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <YAxis domain={[0, yAxisMax]} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />

            {/* AREA BACKGROUND ZONA */}
            {ruleWaspada && (
              <ReferenceArea y1={0} y2={ruleWaspada.threshold} fill="rgba(16, 185, 129, 0.08)" stroke="none" />
            )}
            {ruleWaspada && ruleSiaga && (
              <ReferenceArea y1={ruleWaspada.threshold} y2={ruleSiaga.threshold} fill="rgba(245, 158, 11, 0.08)" stroke="none" />
            )}
            {ruleSiaga && (
              <ReferenceArea y1={ruleSiaga.threshold} y2={yAxisMax} fill="rgba(239, 68, 68, 0.08)" stroke="none" />
            )}

            {/* PENANDA WAKTU SEKARANG */}
            {nowTime && (
              <ReferenceLine x={nowTime} stroke="#ef4444" strokeWidth={2} label={{ value: 'NOW', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
            )}

            {/* GARIS AMBANG BATAS */}
            {sortedRules.map((rule, i) => (
              <ReferenceLine
                key={i}
                y={rule.threshold}
                stroke={rule.label === "Siaga" || rule.label === "Bahaya" ? "#ef4444" : rule.label === "Waspada" ? "#f59e0b" : "#10b981"}
                strokeDasharray="4 4"
                isFront={true}
                label={{ value: rule.label, position: 'right', fill: '#94a3b8', fontSize: 10 }}
              />
            ))}

            {/* LAYER DATA HISTORIS */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke={brandBlue}
              fill={brandBlue}
              fillOpacity={0.2}
              strokeWidth={4}
              isAnimationActive={false}
            />

            {/* LAYER DATA PREDIKSI */}
            <Area
              type="monotone"
              dataKey="prediction"
              stroke="#f97316"
              strokeDasharray="8 5"
              fillOpacity={0}
              strokeWidth={4}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* INSIGHT BOX */}
      <div style={{
        margin: "0 24px 24px",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "12px",
        borderLeft: `4px solid ${status.color}`,
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{ fontSize: "20px" }}>{status.label === "Aman" ? "✅" : "⚠️"}</div>
        <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
          Sistem AI memprediksi kondisi <b>{status.label}</b> dalam 1 jam kedepan. {status.hint}.
        </p>
      </div>

    </div>
  );
}