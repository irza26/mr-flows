import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRainStatus, getTMAStatus } from "../utils/status";

export default function StationPopup({ station, data, onSelect }) {
  const navigate = useNavigate();

  useEffect(() => {
    onSelect(station, data);
  }, [station, data]);

  const isTMA = station.type === "tma";

  const statusObj = isTMA
    ? getTMAStatus(data?.status)
    : getRainStatus(data?.per_hour ?? 0);

  const { label, color, emoji } = statusObj;

  const currentValue = isTMA
    ? `${data?.last ?? "-"} m`
    : `${data?.per_hour ?? 0} mm`;

  const lastUpdate = data?.last_time ?? "-";

  // =========================
  // 🔥 PREDIKSI CH TERDEKAT (REAL TIME)
  // =========================
  const parseTime = (t) => new Date(t.replace(" ", "T"));

  let chPrediction = null;
  let chTime = null;
  let chStatus = null;

  if (!isTMA && data?.prediction_chart?.length) {
    const nowDate = new Date(); // 🔥 FIX DI SINI

    // 🔥 ambil prediksi paling dekat ke sekarang
    let nextPred = data.prediction_chart.find(p => {
      return parseTime(p.time) > nowDate;
    });

    // 🔥 fallback kalau semua sudah lewat
    if (!nextPred) {
      nextPred = data.prediction_chart[0];
    }

    if (nextPred) {
      chPrediction = nextPred.rain;
      chTime = nextPred.time;
      chStatus = getRainStatus(nextPred.rain);
    }
  }

  // 🔥 format jam
  const formatHour = (t) => {
    if (!t) return "-";
    const d = parseTime(t);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div style={{ width: 230, fontSize: 13, lineHeight: 1.5 }}>
      
      <div style={{ fontWeight: "bold", fontSize: 14 }}>
        {isTMA ? "Pos TMA Majalaya" : station.label}
      </div>

      <hr style={{ margin: "8px 0", border: "0.5px solid #eee" }} />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>Status:</span>
        <span style={{ fontWeight: "bold", color }}>
          {emoji} {label}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>{isTMA ? "Tinggi Air" : "Curah Hujan"}:</span>
        <span style={{ fontWeight: "bold" }}>{currentValue}</span>
      </div>

      {/* 🔥 TMA */}
      {isTMA && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>Prediksi 1 Jam:</span>
          <span style={{ fontWeight: "bold", color: "#f97316" }}>
            {data?.prediction ?? "-"} m
          </span>
        </div>
      )}

      {/* 🔥 CH PREDIKSI FIX */}
      {!isTMA && chPrediction !== null && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Prediksi:</span>
            <span style={{ fontWeight: "bold", color: "#f97316" }}>
              {chPrediction} mm
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Jam:</span>
            <span style={{ fontWeight: "bold" }}>
              {formatHour(chTime)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Kategori Prediksi:</span>
            <span style={{ fontWeight: "bold", color: chStatus?.color }}>
              {chStatus?.emoji} {chStatus?.label}
            </span>
          </div>
        </>
      )}

      <div style={{ fontSize: 11, color: "#718096", marginBottom: 10 }}>
        Update: {lastUpdate} WIB
      </div>

      <button
        onClick={() => navigate(isTMA ? "/tma" : `/ch/${station.name}`)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 6,
          background: "#0ea5e9",
          color: "#fff",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Halaman Stasiun
      </button>
    </div>
  );
}