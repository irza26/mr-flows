import { useEffect, useState } from "react";
import DetailTinggiAir from "./DetailTinggiAir";
import DetailPrediksi from "./DetailPrediksi";
import { getTMADashboard } from "../services/api";
import { getTMAStatus } from "../utils/status";
import { getStations } from "../services/api";

export default function DashboardTMA(/*{ station }*/) {
  const [activeTab, setActiveTab] = useState("tma");
  const [data, setData] = useState(null);
  const [stationStatus, setStationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const stationName = "Bendung_Wanir";

  useEffect(() => {
    let isMounted = true;

    const fetchTMA = async () => {
      try {
        const json = await getTMADashboard(stationName);
        if (isMounted && !json?.error) {
          setData(json);
        }

        const stations = await getStations();
        const currentStation = stations.find(
          s => s.station_name === stationName && s.source === "tma"
        );

        if (isMounted && currentStation) {
          setStationStatus(currentStation.status);
        }

      } catch (err) {
        console.error("Dashboard TMA error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTMA();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div style={{ padding: "30px" }}>Memuat data TMA...</div>;
  }

  if (!data) {
    return <div style={{ padding: "30px" }}>Data TMA tidak tersedia</div>;
  }

  const status = getTMAStatus(data.last);

  const renderContent = () => {
    switch (activeTab) {
      case "tma":
        return (
          <DetailTinggiAir
            data={data}
            stationStatus={stationStatus}
          />
        );
      /*case "prediksi":
        return <DetailPrediksi station={station} />;*/
      default:
        return <DetailTinggiAir data={data} stationStatus={stationStatus}/>;
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>
          Monitoring Tinggi Muka Air
        </h2>

        {activeTab !== "tma" && (
          <button
            onClick={() => setActiveTab("tma")}
            style={{
              cursor: "pointer",
              border: "none",
              background: "none",
              color: "#00a8ff",
              fontWeight: "bold"
            }}
          >
            ← Kembali ke Monitoring
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <span className="label">Status Terkini</span>
          <h3 className="value" style={{ color: status.color }}>
            {status.emoji} {status.label}
          </h3>
        </div>

        <div
          className={`stat-card ${activeTab === "tma" ? "active" : ""}`}
          onClick={() => setActiveTab("tma")}
        >
          <span className="label">Tinggi Air Saat Ini</span>
          <h3 className="value">{data.last} m</h3>
        </div>

        <div
          className={`stat-card ${activeTab === "prediksi" ? "active" : ""}`}
          onClick={() => setActiveTab("prediksi")}
        >
          <span className="label">Prediksi Risiko</span>
          <h3 className="value">{data.percent}%</h3>
        </div>
      </div>

      <div className="content-area">{renderContent()}</div>
    </div>
  );
}
