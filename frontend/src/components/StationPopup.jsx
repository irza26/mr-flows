import { useNavigate } from "react-router-dom";
import { getRainStatus, getTMAStatus } from "../utils/status";

export default function StationPopup({ station, data }) {
  const navigate = useNavigate();

  const statusObj =
    station.type === "tma"
      ? getTMAStatus(data?.status)
      : getRainStatus(data?.per_hour ?? 0);

  const statusLabel = statusObj.label;
  const statusColor = statusObj.color;
  const statusEmoji = statusObj.emoji;

  const currentValue =
    station.type === "tma"
      ? `${data?.last ?? "-"} m`
      : `${data?.per_hour ?? 0} mm`;

  const valueLabel =
    station.type === "tma"
      ? "Ketinggian Air"
      : "Curah Hujan";

  const lastUpdate = data?.last_time ?? "-";
  const prediction = "85%";

  return (
    <div style={{ width: 220, fontSize: 13, lineHeight: 1.5 }}>
      
      <div style={{ fontWeight: "bold", fontSize: 15 }}>
        {station.label}
      </div>

      <hr style={{ margin: "8px 0" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6
        }}
      >
        <span>Status:</span>
        <span style={{ fontWeight: "bold", color: statusColor }}>
          {statusEmoji} {statusLabel}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6
        }}
      >
        <span>{valueLabel}:</span>
        <span style={{ fontWeight: "bold" }}>
          {currentValue}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6
        }}
      >
        <span>Prediksi Banjir:</span>
        <span style={{ fontWeight: "bold", color: "#e53e3e" }}>
          {prediction}
        </span>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#718096",
          marginBottom: 10
        }}
      >
        Update: {lastUpdate} WIB
      </div>

      <button
        onClick={() =>
          navigate(
            station.type === "tma"
              ? "/tma"
              : `/ch/${station.name}`
          )
        }
        style={{
          width: "100%",
          padding: "6px 0",
          border: "none",
          borderRadius: 8,
          background: "#0ea5e9",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Detail
      </button>
    </div>
  );
}
