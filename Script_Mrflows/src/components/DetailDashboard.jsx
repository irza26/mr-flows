import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import DetailCurahHujan from "./DetailCurahHujan";
import DetailPrediksiCH from "./DetailPrediksiCH";
import { getCHDashboard } from "../services/api";
import { getRainStatus } from "../utils/status";

export default function DetailDashboard() {
  const { station } = useParams();
  const [fullData, setFullData] = useState(null);
  const [activeTab, setActiveTab] = useState("ch");

  useEffect(() => {
    if (!station) return;

    getCHDashboard(station)
      .then(json => {
        if (!json?.error) {
          setFullData(json);
        } else {
          setFullData(null);
        }
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setFullData(null);
      });
  }, [station]);

  if (!station) return <div style={{ padding: 30 }}>Memuat data...</div>;
  if (!fullData) return <div style={{ padding: 30 }}>Loading...</div>;

  const rainStatus = getRainStatus(fullData.per_hour);

  // =========================
  // 🔥 PREDIKSI REAL-TIME
  // =========================
  const now = new Date();

  const nextPrediction = fullData.prediction_chart?.find(p => {
    const t = new Date(p.time);
    return t > now;
  });

  const fallbackPrediction = fullData.prediction_chart?.slice(-1)[0];

  const prediction = nextPrediction?.rain ?? fallbackPrediction?.rain ?? 0;
  const predictionTime = nextPrediction?.time ?? fallbackPrediction?.time ?? "-";

  return (
    <div style={{ padding: "30px", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>Dashboard Curah Hujan: {station}</h2>

        {activeTab !== "ch" && (
          <button onClick={() => setActiveTab("ch")}>
            ← Kembali
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginBottom: "30px"
      }}>

        {/* STATUS */}
        <div className="stat-card">
          <span>Status</span>
          <h3 style={{ color: rainStatus.color }}>
            {rainStatus.emoji} {rainStatus.label}
          </h3>
        </div>

        {/* CURRENT */}
        <div
          className={`stat-card ${activeTab === "ch" ? "active" : ""}`}
          onClick={() => setActiveTab("ch")}
        >
          <span>Curah Hujan</span>
          <h3>{fullData.current} mm</h3>
        </div>

        {/* 🔥 PREDIKSI */}
        <div
          className={`stat-card ${activeTab === "prediksi" ? "active" : ""}`}
          onClick={() => setActiveTab("prediksi")}
        >
          <span>Prediksi (WCPL)</span>

          <h3>
            {prediction} mm
          </h3>

          {/* 🔥 waktu prediksi */}
          <p style={{ fontSize: 12, margin: 0 }}>
            {predictionTime}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div>
        {activeTab === "ch" && (
          <DetailCurahHujan data={fullData} />
        )}

        {activeTab === "prediksi" && (
          <DetailPrediksiCH data={fullData} />
        )}
      </div>

    </div>
  );
}