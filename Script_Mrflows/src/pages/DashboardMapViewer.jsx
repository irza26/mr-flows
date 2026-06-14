import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, GeoJSON } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";

import { getTMADashboard, getCHDashboard } from "../services/api";
import { getRainStatus, getTMAStatus } from "../utils/status";
import AlertModal from "../components/AlertModal";

// Import aset logo
import logoMrFlows from '../assets/logo.png'; 

const STATIONS = [
  { name: "Cihawuk",       label: "PCH Cihawuk",        type: "ch",  lat: -7.185951, lon: 107.699982 },
  { name: "Cikitu",        label: "PCH Cikitu",          type: "ch",  lat: -7.142651, lon: 107.691972 },
  { name: "Nagrak",        label: "PCH Nagrak",          type: "ch",  lat: -7.127906, lon: 107.724088 },
  { name: "Ibun",          label: "PCH Ibun",            type: "ch",  lat: -7.099045, lon: 107.763373 },
  { name: "Paseh Cipaku",  label: "PCH Paseh Cipaku",    type: "ch",  lat: -7.056617, lon: 107.763847 },
  { name: "Kertasari",     label: "PCH Kertasari",       type: "ch",  lat: -7.1919,   lon: 107.676883 },
  { name: "Bendung_Wanir", label: "AWLR Bendung Wanir",  type: "tma", lat: -7.050619, lon: 107.756644 },
];

const markerIcon = ({ type, color }) =>
  new L.DivIcon({
    className: "",
    html: `
      <div style="width:36px;height:36px;border-radius:50%;background:${color};
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 4px 10px rgba(0,0,0,0.3);">
        <div style="width:26px;height:26px;border-radius:50%;background:white;
                    display:flex;align-items:center;justify-content:center;">
          <img src="/icons/${type}.jpg" style="width:14px;height:14px;" />
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

export default function DashboardMapViewer() {
  const navigate = useNavigate();
  const [dataMap, setDataMap] = useState({});
  const [dasGeo, setDasGeo] = useState(null);
  const [riverGeo, setRiverGeo] = useState(null);
  const [kecGeo, setKecGeo] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState("");
  const [alertStation, setAlertStation] = useState("");
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);

  const alertTriggered = useRef(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isLaptop = windowWidth >= 1024 && windowWidth < 1440;
  const isDesktopPC = windowWidth >= 1440;

  const getSidebarWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) return "340px";
    if (isLaptop) return "400px";
    if (isDesktopPC) return "460px";
    return "400px";
  };

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [dasGeo, riverGeo, kecGeo, windowWidth]);

  useEffect(() => {
    shp("/DAS/DAS.zip").then(setDasGeo).catch(console.error);
    shp("/Sungai/Sungai_DAS.zip").then(setRiverGeo).catch(console.error);
    shp("/DAS/MAJALAYA.zip").then(setKecGeo).catch(console.error);
  }, []);

  useEffect(() => {
    STATIONS.forEach((st) => {
      const fetcher = st.type === "tma" ? getTMADashboard : getCHDashboard;
      fetcher(st.name).then((res) =>
        setDataMap((prev) => ({ ...prev, [st.label]: res }))
      );
    });
  }, []);

  useEffect(() => {
    const tmaData = dataMap["AWLR Bendung Wanir"];
    if (!tmaData) return;
    if ((tmaData.status === "Waspada" || tmaData.status === "Siaga" || tmaData.status === "Bahaya") && !alertTriggered.current) {
      const key = `alert_${tmaData.status}_${tmaData.last_time}`;
      if (!localStorage.getItem(key)) {
        alertTriggered.current = true;
        setTimeout(() => {
          setAlertStatus(tmaData.status);
          setAlertStation("Bendung Wanir");
          setShowAlert(true);
        }, 0);
        localStorage.setItem(key, "shown");
      }
    }
  }, [dataMap]);

  const focusStationOnMap = (lat, lon) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 14, { animate: true });
    }
  };

  const parseTime = (t) => {
    if (!t || t === "-") return new Date();
    return new Date(t.replace(" ", "T"));
  };

  const formatHour = (dateObj) => {
    if (!dateObj) return "-";
    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  const getPredictionInfo = (st, d) => {
    if (!d) return { val: "-", timeLabel: "" };

    if (st.type === "tma") {
      const lastUpdate = parseTime(d.last_time);
      lastUpdate.setHours(lastUpdate.getHours() + 1);
      return {
        val: `${d.prediction ?? "-"} m`,
        timeLabel: `Jam ${formatHour(lastUpdate)}`
      };
    } else {
      if (d.prediction_chart && d.prediction_chart.length > 0) {
        const nowDate = new Date();
        let nextPred = d.prediction_chart.find(p => parseTime(p.time) > nowDate);
        
        if (!nextPred) {
          nextPred = d.prediction_chart[0];
        }

        if (nextPred) {
          const predDate = parseTime(nextPred.time);
          return {
            val: `${nextPred.rain !== null && nextPred.rain !== undefined ? nextPred.rain : "-"} mm`,
            timeLabel: `Jam ${formatHour(predDate)}`
          };
        }
      }
      return { val: `${(d.prediction_chart?.[0]?.rain !== null && d.prediction_chart?.[0]?.rain !== undefined) ? d.prediction_chart?.[0]?.rain : "-"} mm`, timeLabel: "Jam -" };
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: isMobile ? "column" : "row", 
      width: "100vw", 
      height: "100vh", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#f8fafc",
      overflow: "hidden"
    }}>
      
      {/* ════════════════ PANEL RINGKASAN DATA STASIUN ════════════════ */}
      <div style={{
        width: getSidebarWidth(),
        height: "100vh", // 🔥 Diubah jadi 100vh terus menerus supaya di HP memenuhi full screen
        display: "flex",
        flexDirection: "column",
        boxShadow: isMobile ? "none" : "4px 0 24px rgba(0,0,0,0.06)",
        zIndex: 1000,
        backgroundColor: "#fff",
        flexShrink: 0,
        order: isMobile ? 2 : 1
      }}>
        
        {/* HEADER IDENTITY: Logo & Branding Identity */}
        <div style={{ padding: "20px 20px 15px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <img 
              src={logoMrFlows} 
              alt="Logo MR-FLOWS" 
              style={{ 
                width: '42px', 
                height: '42px', 
                objectFit: 'cover',
                borderRadius: '50%',
                backgroundColor: '#f8fafc', 
                display: 'block',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                MR-FLOWS
              </h2>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500', lineHeight: '1.2', marginTop: '2px' }}>
                Majalaya River Flood Warning System
              </span>
            </div>
          </div>

          {/* TOMBOL NAVIGASI UTAMA */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/map-viewer")}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: '10px', background: "#0f172a",
                color: "#fff", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Map Viewer Utama
            </button>
            <button
              onClick={() => navigate("/layanan")}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: '10px', background: "#2563eb",
                color: "#fff", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Layanan Pengguna
            </button>
          </div>
        </div>

        {/* SUB-HEADER: Informasi Area Monitoring Lokasi */}
        <div style={{ padding: "14px 20px 4px 20px", backgroundColor: "#f8fafc" }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: 0 }}>
            Lokasi Monitoring Stasiun
          </h3>
        </div>

        {/* LIST DETAIL STASIUN (SCROLLABLE) */}
        <div style={{ padding: "12px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {STATIONS.map((st) => {
            const d = dataMap[st.label];
            const isTMA = st.type === "tma";
            
            if (!d) return (
              <div key={st.label} style={{ padding: "14px", background: "#f1f5f9", borderRadius: "10px", fontSize: "12px", color: "#64748b" }}>
                Sinkronisasi data {st.label}...
              </div>
            );

            const statusObj = isTMA ? getTMAStatus(d.status) : getRainStatus(d.per_hour);
            const currentValue = isTMA ? `${d.last ?? "-"} m` : `${d.per_hour ?? 0} mm`;
            const predInfo = getPredictionInfo(st, d);

            return (
              <div 
                key={st.label}
                onClick={() => focusStationOnMap(st.lat, st.lon)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: "1px solid #e2e8f0",
                  borderLeft: `5px solid ${statusObj.color}`,
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <b style={{ fontSize: "14px", color: "#1e293b", fontWeight: "700" }}>
                    {isTMA ? "Pos TMA AWLR Majalaya" : st.label}
                  </b>
                  <span style={{ 
                    fontSize: "11px", padding: "3px 9px", borderRadius: "20px", 
                    backgroundColor: `${statusObj.color}15`, color: statusObj.color, fontWeight: "700" 
                  }}>
                    {statusObj.emoji || statusObj.bullet} {statusObj.label}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                  <span>{isTMA ? "Tinggi Muka Air (TMA):" : "Intensitas Curah Hujan:"}</span>
                  <b style={{ color: "#0f172a" }}>{currentValue}</b>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                  <span>Prediksi ({predInfo.timeLabel}):</span>
                  <span style={{ fontWeight: "700", color: "#f97316" }}>
                    {predInfo.val}
                  </span>
                </div>

                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "8px", textAlign: "right", fontWeight: "500" }}>
                  {d.last_time ?? "-"} WIB
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════ PANEL PETA INTERAKTIF FULL SCREEN ════════════════ */}
      {/* 🔥 Logika Kondisional: Peta Leaflet hanya di-render jika layar BUKAN mobile */}
      {!isMobile && (
        <div style={{ flex: 1, height: "100vh", position: "relative", overflow: "hidden", order: 2 }}>
          <MapContainer
            center={[-7.12, 107.7]}
            zoom={12}
            minZoom={9}
            zoomControl={false}
            scrollWheelZoom={true}
            dragging={true}
            style={{ height: "100%", width: "100%", position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            ref={mapRef}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ZoomControl position="bottomright" />

            {dasGeo   && <GeoJSON data={dasGeo}   style={{ color: "#000", weight: 2, fillOpacity: 0.01 }} />}
            {riverGeo && <GeoJSON data={riverGeo} style={{ color: "#2563eb", weight: 1.5 }} />}
            {kecGeo   && <GeoJSON data={kecGeo}   style={{ color: "#7a2f00", weight: 1, dashArray: "4 4", fillOpacity: 0 }} />}

            {STATIONS.map((st) => {
              const d = dataMap[st.label];
              if (!d) return null;
              const status = st.type === "tma" ? getTMAStatus(d.status) : getRainStatus(d.per_hour);
              return (
                <Marker
                  key={st.label}
                  position={[st.lat, st.lon]}
                  icon={markerIcon({ type: st.type, color: status.color })}
                  eventHandlers={{
                    click: () => focusStationOnMap(st.lat, st.lon)
                  }}
                />
              );
            })}
          </MapContainer>
        </div>
      )}

      {showAlert && (
        <AlertModal status={alertStatus} stationName={alertStation} onClose={() => setShowAlert(false)} />
      )}
    </div>
  );
}