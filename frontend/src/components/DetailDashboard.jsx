import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import DetailCurahHujan from "./DetailCurahHujan";
import PrediksiCH from "./PrediksiCH";
import { getCHDashboard } from "../services/api";
import { getRainStatus } from "../utils/status";

export default function DetailDashboard() {
  const { station } = useParams();
  const [activeTab, setActiveTab] = useState("ch");
  const [fullData, setFullData] = useState(null);

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
  
  if (!station) {
    return <div style={{ padding: 30 }}>Memuat data stasiun...</div>;
  }

  if (!fullData) {
    return <div style={{ padding: 30 }}>Mengambil data curah hujan...</div>;
  }

  const rainStatus = fullData
    ? getRainStatus(fullData.current)
    : null;

  const renderContent = () => {
    switch (activeTab) {
      case "ch":
        return (
          <DetailCurahHujan
            data={fullData}
          />
        );
      /*case "prediksi":
        return <PrediksiCH data={fullData} />;*/
      default:
        return <DetailCurahHujan data={fullData}/>;
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>
          Dashboard Curah Hujan: {station}
        </h2>

        {activeTab !== "ch" && (
          <button
            onClick={() => setActiveTab("ch")}
            style={{
              cursor: "pointer",
              border: "1px solid #00a8ff",
              background: "white",
              color: "#00a8ff",
              padding: "8px 15px",
              borderRadius: "5px",
              fontWeight: "bold"
            }}
          >
            ← Kembali ke Monitoring
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div
          className="white-card"
          style={{
            borderLeft: rainStatus ? `5px solid ${rainStatus.color}` : "none"
          }}
        >
          <p>Status Kondisi</p>

          {rainStatus ? (
            <>
              <h3 style={{ color: rainStatus.color, marginBottom: 5 }}>
                {rainStatus.emoji} {rainStatus.label}
              </h3>
              <p style={{ fontSize: 12, color: "#718096", margin: 0 }}>
                {rainStatus.desc}
              </p>
            </>
          ) : (
            <h3>-</h3>
          )}
        </div>

        <div
          className="white-card"
          style={{
            cursor: "pointer",
            borderBottom: activeTab === "ch" ? "4px solid #00a8ff" : "none"
          }}
          onClick={() => setActiveTab("ch")}
        >
          <p>Curah Hujan Terkini</p>
          <h3>{fullData?.current ?? 0} mm</h3>
        </div>

        <div
          className="white-card"
          style={{
            cursor: "pointer",
            borderBottom: activeTab === "prediksi" ? "4px solid #00a8ff" : "none"
          }}
          onClick={() => setActiveTab("prediksi")}
        >
          <p>Prediksi 6 Jam</p>
          <h3>{fullData?.prediction ?? 0} mm</h3>
        </div>
      </div>

      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
}
