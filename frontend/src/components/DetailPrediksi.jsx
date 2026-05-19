import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";

const ClockIcon = ({ color }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function getStatusFromPrediction(prediction, sortedRules) {
  let label = "Aman";
  sortedRules.forEach(rule => {
    if (prediction >= rule.threshold) label = rule.label;
  });
  const colorMap = {
    Aman: "#10b981", Waspada: "#f59e0b", Siaga: "#f97316", Bahaya: "#ef4444"
  };
  const hintMap = {
    Aman: "Kondisi stabil", Waspada: "Monitoring ketat diperlukan",
    Siaga: "Potensi banjir tinggi", Bahaya: "Evakuasi mungkin diperlukan"
  };
  return {
    label,
    color: colorMap[label] || "#0ea5e9",
    hint: hintMap[label] || "",
  };
}

export default function DetailPrediksi({ data }) {
  const brandBlue = "#0ea5e9";
  const lastTime  = data?.last_time;

  const estimatedTime = useMemo(() => {
    if (!lastTime) return "-";
    const base = new Date(lastTime);
    base.setMinutes(base.getMinutes() + 60);
    return base.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }, [lastTime]);

  if (!data) return null;

  const current          = parseFloat(data.last || 0);
  const predictionSeries = data.prediction_series || [];

  // Ambil prediksi 1 jam (langkah pertama) dan puncak prediksi
  const firstPred = predictionSeries[0]?.water_level ?? data.prediction ?? 0;
  const peakPred  = predictionSeries.length > 0
    ? Math.max(...predictionSeries.map(d => d.water_level))
    : firstPred;

  const isNaik = firstPred > current;
  const delta  = Math.abs(firstPred - current).toFixed(2);

  const sortedRules = Array.isArray(data?.rules)
    ? [...data.rules].sort((a, b) => a.threshold - b.threshold).filter(r => r.label !== "Aman")
    : [];

  const ruleWaspada = sortedRules.find(r => r.label === "Waspada");
  const ruleSiaga   = sortedRules.find(r => r.label === "Siaga");
  const ruleBahaya  = sortedRules.find(r => r.label === "Bahaya");

  const maxThreshold = ruleBahaya?.threshold ?? ruleSiaga?.threshold ?? 2.5;
  const yAxisMax     = +(maxThreshold + 0.5).toFixed(1);

  const status1h   = getStatusFromPrediction(firstPred, sortedRules);
  const statusPeak = getStatusFromPrediction(peakPred,  sortedRules);

  // Split historis (2 jam terakhir) dan prediksi
  const lastHourData = (data.chart || []).slice(-12);
  const lastActual   = lastHourData[lastHourData.length - 1];
  const nowTime      = lastActual?.time;

  // Pisahkan nowcast vs WRF — WRF hanya muncul SETELAH index nowcast terakhir
  const lastNowcastIdx = predictionSeries.reduce((acc, d, i) => d.source === "nowcast" ? i : acc, -1);
  const nowcastSeries  = predictionSeries.filter(d => d.source === "nowcast");
  const wrfSeries      = predictionSeries.filter((d, i) => d.source === "wrf" && i > lastNowcastIdx);
  const wrfStartTime   = wrfSeries.length > 0 ? wrfSeries[0].time : null;

  // Bangun chart data — bridge di titik lastActual agar garis menyambung
  const bridgeSource = nowcastSeries.length > 0 ? "nowcast" : "wrf_pred";
  const chartData = [
    ...lastHourData.map(d => ({ time: d.time, actual: d.water_level })),
    // bridge: aktual → prediksi pertama
    ...(lastActual ? [{
      time:          lastActual.time,
      actual:        lastActual.water_level,
      [bridgeSource]: lastActual.water_level,
    }] : []),
    ...nowcastSeries.map(d => ({ time: d.time, nowcast: d.water_level })),
    // bridge: nowcast → WRF
    ...(nowcastSeries.length > 0 && wrfSeries.length > 0 ? [{
      time:     nowcastSeries[nowcastSeries.length - 1].time,
      nowcast:  nowcastSeries[nowcastSeries.length - 1].water_level,
      wrf_pred: nowcastSeries[nowcastSeries.length - 1].water_level,
    }] : []),
    ...wrfSeries.map(d => ({ time: d.time, wrf_pred: d.water_level })),
  ];

  // Informasi cakupan WRF
  const wrfCoverage = wrfSeries.length > 0
    ? `${wrfSeries[0].time} – ${wrfSeries[wrfSeries.length - 1].time}`
    : null;
  const horizonLabel = predictionSeries.length > 0
    ? predictionSeries[predictionSeries.length - 1].time
    : "-";

  return (
    <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <b style={{ color: brandBlue }}>AI Forecast System</b>
      </div>

      {/* HERO — prediksi 1 jam */}
      <div style={{ padding: "30px 24px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, color: "#64748b" }}>Prediksi TMA (1 Jam Kedepan)</p>
          <h1 style={{ fontSize: 72, margin: 0, fontWeight: "800", letterSpacing: "-2px" }}>
            {firstPred.toFixed(2)} m
          </h1>
          <p style={{ color: isNaik ? "#ef4444" : "#10b981", fontWeight: "bold", marginTop: "5px" }}>
            {isNaik ? "⬆️ Estimasi Naik" : "⬇️ Estimasi Turun"} {delta} m
          </p>
          <div style={{
            background: status1h.color + "15", color: status1h.color,
            padding: "6px 12px", borderRadius: "12px",
            display: "inline-block", fontWeight: "bold", fontSize: "14px",
            marginTop: "10px", border: `1px solid ${status1h.color}30`
          }}>
            {status1h.label}
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: "5px" }}>Estimasi (Waktu Lokal)</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>{estimatedTime}</h3>
          <ClockIcon color={brandBlue} />
        </div>
      </div>

      {/* INFO CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "0 24px 20px" }}>
        {/* Puncak 12 jam */}
        <div style={{ background: statusPeak.color + "10", border: `1px solid ${statusPeak.color}30`, borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Puncak Prediksi (12 Jam)</p>
          <b style={{ fontSize: 22, color: statusPeak.color }}>{peakPred.toFixed(2)} m</b>
          <p style={{ fontSize: 11, color: statusPeak.color, margin: "4px 0 0", fontWeight: "bold" }}>{statusPeak.label}</p>
        </div>

        {/* Horizon */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Hingga</p>
          <b style={{ fontSize: 15, color: "#334155" }}>{horizonLabel}</b>
          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>{predictionSeries.length} langkah ke depan</p>
        </div>

        {/* WRF coverage */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Data Hujan</p>
          {wrfCoverage ? (
            <>
              <b style={{ fontSize: 12, color: "#15803d" }}>WRF ITB</b>
              <p style={{ fontSize: 10, color: "#16a34a", margin: "4px 0 0" }}>{wrfCoverage}</p>
            </>
          ) : (
            <>
              <b style={{ fontSize: 12, color: "#6b7280" }}>Nowcast</b>
              <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>WRF tidak tersedia</p>
            </>
          )}
        </div>
      </div>

      {/* CHART HEADER */}
      <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>Trend Prediksi & Historis</h4>

        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          {[
            { color: brandBlue,  dash: false,  label: "Historis" },
            { color: "#f97316",  dash: true,   label: "Nowcast" },
            { color: "#a855f7",  dash: true,   label: "WRF ITB" },
          ].map(({ color, dash, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
              <div style={{
                width: "20px", height: "3px", background: dash ? "none" : color,
                borderTop: dash ? `2px dashed ${color}` : "none",
              }} />
              {label}
            </div>
          ))}
          <div style={{ width: "1px", background: "#e2e8f0" }} />
          {[
            { bg: "rgba(16,185,129,0.1)",   label: "Aman" },
            { bg: "rgba(245,158,11,0.1)",   label: "Waspada" },
            { bg: "rgba(249,115,22,0.1)",   label: "Siaga" },
            { bg: "rgba(239,68,68,0.1)",    label: "Bahaya" },
          ].map(({ bg, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: bg }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div style={{ padding: "10px 24px 30px 24px" }}>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, yAxisMax]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />

            {/* Zona background */}
            {ruleWaspada && <ReferenceArea y1={0} y2={ruleWaspada.threshold} fill="rgba(16,185,129,0.08)" stroke="none" />}
            {ruleWaspada && ruleSiaga   && <ReferenceArea y1={ruleWaspada.threshold} y2={ruleSiaga.threshold}   fill="rgba(245,158,11,0.08)" stroke="none" />}
            {ruleSiaga   && ruleBahaya  && <ReferenceArea y1={ruleSiaga.threshold}   y2={ruleBahaya.threshold}  fill="rgba(249,115,22,0.08)" stroke="none" />}
            {ruleBahaya  && <ReferenceArea y1={ruleBahaya.threshold}  y2={yAxisMax}  fill="rgba(239,68,68,0.08)"  stroke="none" />}

            {/* Garis ambang */}
            {sortedRules.map((rule) => {
              const clr = rule.label === "Bahaya" ? "#ef4444"
                : rule.label === "Siaga"   ? "#f97316"
                : rule.label === "Waspada" ? "#f59e0b" : "#10b981";
              return (
                <ReferenceLine key={rule.label} y={rule.threshold} stroke={clr}
                  strokeDasharray="4 4" isFront
                  label={{ value: rule.label, position: "right", fill: "#94a3b8", fontSize: 10 }}
                />
              );
            })}

            {/* Penanda waktu sekarang */}
            {nowTime && (
              <ReferenceLine x={nowTime} stroke="#ef4444" strokeWidth={2}
                label={{ value: "NOW", position: "top", fill: "#ef4444", fontSize: 10, fontWeight: "bold" }}
              />
            )}

            {/* Penanda mulai WRF */}
            {wrfStartTime && wrfStartTime !== nowTime && (
              <ReferenceLine x={wrfStartTime} stroke="#a855f7" strokeWidth={1.5} strokeDasharray="6 3"
                label={{ value: "WRF", position: "top", fill: "#a855f7", fontSize: 10, fontWeight: "bold" }}
              />
            )}

            {/* Data historis */}
            <Area type="monotone" dataKey="actual"
              stroke={brandBlue} fill={brandBlue} fillOpacity={0.15}
              strokeWidth={3} isAnimationActive={false} dot={false}
            />

            {/* Prediksi nowcast */}
            <Area type="monotone" dataKey="nowcast"
              stroke="#f97316" strokeDasharray="8 5" fillOpacity={0}
              strokeWidth={3} isAnimationActive={false} dot={false}
            />

            {/* Prediksi WRF */}
            <Area type="monotone" dataKey="wrf_pred"
              stroke="#a855f7" strokeDasharray="5 3" fillOpacity={0}
              strokeWidth={3} isAnimationActive={false} dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* INSIGHT BOX */}
      <div style={{
        margin: "0 24px 24px", padding: "16px", background: "#f8fafc",
        borderRadius: "12px", borderLeft: `4px solid ${status1h.color}`,
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <div style={{ fontSize: "20px" }}>{status1h.label === "Aman" ? "✅" : "⚠️"}</div>
        <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
          Sistem AI memprediksi kondisi <b>{status1h.label}</b> dalam 1 jam kedepan. {status1h.hint}.
          {peakPred > firstPred && (
            <> Puncak prediksi 12 jam: <b>{peakPred.toFixed(2)} m</b> ({statusPeak.label}).</>
          )}
        </p>
      </div>

    </div>
  );
}
