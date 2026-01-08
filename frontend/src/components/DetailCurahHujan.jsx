import React from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DetailCurahHujan({ data}) {
  const chartData = Array.isArray(data.chart) ? data.chart : [];
  const isActive = true;
  
  if (!data) {
    return <div style={{ padding: 30 }}>Data curah hujan tidak tersedia</div>;
  }

  return (
    <div className="detail-container">
      <div className="white-card" style={{ padding: 30, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <span
              style={{
                background: isActive ? "#e6fffa" : "#fed7d7",
                color: isActive ? "#065f46" : "#9b2c2c",
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: "bold",
                border: `1px solid ${isActive ? "#38a169" : "#e53e3e"}`,
                display: "inline-block"
              }}
            >
              🟢 Alat Aktif
            </span>
            <h1 style={{ fontSize: 64, margin: "15px 0", fontWeight: "800" }}>
              {data.current}{" "}
              <span style={{ fontSize: 22, fontWeight: "400" }}>mm</span>
            </h1>

            <p style={{ color: "#718096" }}>
              Curah Hujan Saat Ini (Interval 10 menit)
            </p>
          </div>

          <div style={{ textAlign: "right", fontSize: 12 }}>
            <p style={{ color: "#a0aec0", margin: 0 }}>Terakhir update:</p>
            <b style={{ color: "#2d3748" }}>{data.last_time} WIB</b>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          marginBottom: 20
        }}
      >
        <InfoBox
          label="Intensitas Per Jam"
          value={`${data.per_hour} mm/jam`}
          activeColor={isActive ? "#38a169" : null}
        />
        <InfoBox
          label="Akumulasi Harian"
          value={`${data.daily} mm/hari`}
        />
        <InfoBox
          label="Prediksi 6 Jam"
          value={`${data.prediction} mm`}
          danger={data.prediction >= 10}
        />
      </div>

      <div className="white-card" style={{ padding: 25 }}>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>
          Curah Hujan 24 Jam Terakhir
        </h3>

        {chartData.length === 0 ? (
          <p style={{ color: "#999" }}>Tidak ada data 24 jam terakhir</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a8ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00a8ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              />
              <Area
                type="monotone"
                dataKey="rain_fall"
                stroke="#00a8ff"
                strokeWidth={3}
                fill="url(#rain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value, danger, activeColor }) {
  return (
    <div
      className="white-card"
      style={{
        padding: 20,
        borderLeft: activeColor
          ? `5px solid ${activeColor}`
          : danger
          ? "5px solid #e53e3e"
          : "none"
      }}
    >
      <p style={{ fontSize: 13, color: "#718096", marginBottom: 5 }}>
        {label}
      </p>
      <h2 style={{ margin: 0, fontSize: 20 }}>{value}</h2>
    </div>
  );
}
