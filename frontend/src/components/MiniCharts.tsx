import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

interface ChartDataPoint {
  time: string;
  water_level?: number;
  rain_fall?: number;
  rain?: number;
}

interface StationData {
  chart?: ChartDataPoint[];
  prediction_series?: ChartDataPoint[];
  prediction_chart?: ChartDataPoint[];
}

interface MiniChartProps { data: StationData; }

// 🔥 helper time parser
const parseTime = (t: string) => new Date(t.replace(" ", "T"));

/* =========================
   MINI TMA CHART (FIX PREDIKSI MUNCUL)
========================= */
export function MiniTMAChart({ data }: MiniChartProps) {
  if (!data) return null;

  const lastData = (data.chart || []).slice(-6);
  const nowTime = lastData[lastData.length - 1]?.time;
  const nowDate = nowTime ? parseTime(nowTime) : null;

  // 🔥 FIX: jangan sampai kosong
  const predictionSeries = data.prediction_series || [];

  let futurePrediction = predictionSeries.filter(d => {
    if (!nowDate) return true;
    return parseTime(d.time) > nowDate;
  });

  // 🔥 FALLBACK (INI KUNCI)
  if (futurePrediction.length === 0) {
    futurePrediction = predictionSeries;
  }

  const chartData = [
    ...lastData.map(d => ({
      time: d.time,
      actual: d.water_level
    })),
    ...futurePrediction.map(d => ({
      time: d.time,
      prediction: d.water_level
    }))
  ];

  return (
    <div style={{ width: "100%", height: 180 }}>

      {/* 🔥 LEGEND */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "10px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: 12, height: 3, background: "#0ea5e9" }}></div> Aktual
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: 12, borderTop: "2px dashed #f97316" }}></div> Prediksi
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />

          <Tooltip />

          {/* 🔥 NOW */}
          {nowTime && (
            <ReferenceLine x={nowTime} stroke="#ef4444" strokeWidth={2} />
          )}

          {/* 🔵 AKTUAL */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.2}
            strokeWidth={2}
            connectNulls
          />

          {/* 🟠 PREDIKSI */}
          <Area
            type="monotone"
            dataKey="prediction"
            stroke="#f97316"
            strokeDasharray="5 5"
            fill="none"
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


/* =========================
   MINI CH CHART (WRF)
========================= */
export function MiniCHChart({ data }: MiniChartProps) {
  if (!data) return null;

  const lastData = (data.chart || []).slice(-6);
  const nowTime = lastData[lastData.length - 1]?.time;
  const nowDate = nowTime ? parseTime(nowTime) : null;

  const predictionChart = data.prediction_chart || [];

  const futurePrediction = predictionChart.filter(d => {
    if (!nowDate) return true;
    return parseTime(d.time) > nowDate;
  });

  const chartData = [
    ...lastData.map(d => ({
      time: d.time,
      actual: d.rain_fall
    })),
    ...futurePrediction.map(d => ({
      time: d.time,
      prediction: d.rain
    }))
  ];

  return (
    <div style={{ width: "100%", height: 180 }}>

      {/* 🔥 LEGEND */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "6px", fontSize: "10px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: 12, height: 3, background: "#00a8ff" }}></div> Aktual
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: 12, borderTop: "2px dashed #f97316" }}></div> Prediksi
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />

          <Tooltip />

          {/* 🔥 NOW */}
          {nowTime && (
            <ReferenceLine x={nowTime} stroke="#ef4444" strokeWidth={2} />
          )}

          {/* 🔵 AKTUAL */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#00a8ff"
            fill="#00a8ff"
            fillOpacity={0.2}
            strokeWidth={2}
            connectNulls
          />

          {/* 🟠 PREDIKSI */}
          <Area
            type="monotone"
            dataKey="prediction"
            stroke="#f97316"
            strokeDasharray="5 5"
            fill="none"
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}