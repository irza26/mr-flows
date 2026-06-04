import { useEffect, useState, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";

import { getTMADashboard, getCHDashboard } from "../services/api";
import { getRainStatus, getTMAStatus } from "../utils/status";
import StationPopup from "./StationPopup";
import { MiniTMAChart, MiniCHChart } from "./MiniCharts";
import AlertModal from "./AlertModal";

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
      <div style="width:42px;height:42px;border-radius:50%;background:${color};
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 6px 14px rgba(0,0,0,0.35);">
        <div style="width:30px;height:30px;border-radius:50%;background:white;
                    display:flex;align-items:center;justify-content:center;">
          <img src="/icons/${type}.jpg" style="width:18px;height:18px;" />
        </div>
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -36],
  });

export default function MapViewer() {
  const [dataMap,         setDataMap]         = useState({});
  const [dasGeo,          setDasGeo]          = useState(null);
  const [riverGeo,        setRiverGeo]        = useState(null);
  const [kecGeo,          setKecGeo]          = useState(null);
  const [layerVisibility, setLayerVisibility] = useState({ das: false, sungai: false, kecamatan: true });
  const [layerOpen,       setLayerOpen]       = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedData,    setSelectedData]    = useState(null);
  const [showAlert,       setShowAlert]       = useState(false);
  const [alertStatus,     setAlertStatus]     = useState("");
  const [alertStation,    setAlertStation]    = useState("");
  const [isMobile,        setIsMobile]        = useState(() => window.innerWidth < 768);

  const alertTriggered = useRef(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>

      <MapContainer
        center={[-7.12, 107.7]}
        zoom={12.4}
        minZoom={9}
        zoomControl={false}
        scrollWheelZoom={!isMobile}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position={isMobile ? "topright" : "bottomright"} />

        {dasGeo   && layerVisibility.das       && <GeoJSON data={dasGeo}   style={{ color: "#000",    weight: 3 }} />}
        {riverGeo && layerVisibility.sungai    && <GeoJSON data={riverGeo} style={{ color: "#2563eb", weight: 2 }} />}
        {kecGeo   && layerVisibility.kecamatan && <GeoJSON data={kecGeo}   style={{ color: "#7a2f00", weight: 1, dashArray: "4 4" }} />}

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
                popupopen:  () => { setSelectedStation(st); setSelectedData(d); },
                popupclose: () => { setSelectedStation(null); setSelectedData(null); },
              }}
            >
              <Popup>
                <StationPopup
                  key={st.label}
                  station={st}
                  data={d}
                  onSelect={(station, data) => { setSelectedStation(station); setSelectedData(data); }}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ═══════════ DESKTOP ═══════════ */}
      {!isMobile && (
        <>
          {/* Card Sumber Data - Kiri Atas */}
          <div style={{
            position: "absolute", top: 20, left: 20,
            background: "#fff", padding: "12px 14px",
            borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            fontSize: 12, zIndex: 1000, maxWidth: 240,
          }}>
            <b>Sumber Data</b>
            <hr style={{ opacity: 0.2, margin: "8px 0" }} />
            <p style={{ margin: 0, color: "#475569", lineHeight: "1.5" }}>
              Data pengamatan pos hidrologi berasal dari <b>BBWS Citarum</b> dan <b>PUPR Jawa Barat</b>.
            </p>
          </div>

          {/* Layer control - kanan atas */}
          <div style={{
            position: "absolute", top: 20, right: 20,
            background: "#fff", padding: "12px 14px",
            borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            fontSize: 12, zIndex: 1000, minWidth: 180,
          }}>
            <b>Layer Peta</b><hr style={{ opacity: 0.2, margin: "8px 0" }} />
            <LayerCheck label="Batas DAS"       checked={layerVisibility.das}       onChange={() => setLayerVisibility(v => ({ ...v, das:       !v.das }))} />
            <LayerCheck label="Jaringan Sungai" checked={layerVisibility.sungai}    onChange={() => setLayerVisibility(v => ({ ...v, sungai:    !v.sungai }))} />
            <LayerCheck label="Batas Kecamatan" checked={layerVisibility.kecamatan} onChange={() => setLayerVisibility(v => ({ ...v, kecamatan: !v.kecamatan }))} />
          </div>

          {/* Legenda + Chart berdampingan - kiri bawah */}
          <div style={{
            position: "absolute", bottom: 20, left: 20, zIndex: 1000,
            display: "flex", alignItems: "flex-end", gap: 15, pointerEvents: "none",
            width: "calc(100% - 40px)",
          }}>
            <div style={{
              backgroundColor: "#fff", padding: 14, borderRadius: 12, width: 200,
              fontSize: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", pointerEvents: "auto",
            }}>
              <b>Legenda</b><hr style={{ opacity: 0.2, margin: "8px 0" }} />
              <b>TMA</b>
              <LegendItem color="#38a169" label="Aman" />
              <LegendItem color="#d69e2e" label="Waspada" />
              <LegendItem color="#f97316" label="Siaga" />
              <LegendItem color="#e53e3e" label="Bahaya" />
              <hr style={{ opacity: 0.2, margin: "8px 0" }} />
              <b>Curah Hujan</b>
              <LegendItem color="#38a169" label="Tidak Hujan" />
              <LegendItem color="#4299e1" label="Ringan" />
              <LegendItem color="#d69e2e" label="Sedang" />
              <LegendItem color="#ed8936" label="Lebat" />
              <LegendItem color="#e53e3e" label="Sangat Lebat" />
            </div>

            {selectedStation && selectedData && (
              <div style={{
                width: 380,
                background: "#fff", borderRadius: 12, padding: 15,
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)", pointerEvents: "auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <b style={{ fontSize: 13 }}>Trend: {selectedStation.label}</b>
                  <button onClick={() => setSelectedStation(null)}
                    style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}>✕</button>
                </div>
                <div style={{ height: 180, width: "100%" }}>
                  {selectedStation.type === "tma"
                    ? <MiniTMAChart data={selectedData} />
                    : <MiniCHChart  data={selectedData} />}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ MOBILE ═══════════ */}
      {isMobile && (
        <>
          {/* Card Sumber Data - Kiri Atas Mobile */}
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 1000,
            background: "#fff", padding: "8px 10px", borderRadius: 10,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)", fontSize: 10, maxWidth: 160,
          }}>
            <span style={{ color: "#475569" }}>Sumber: <b>BBWS Citarum</b> & <b>PUPR Jabar</b></span>
          </div>

          {/* Layer control - kanan atas, collapsible */}
          <div style={{
            position: "absolute", top: 10, right: 60, zIndex: 1000,
            background: "#fff", borderRadius: 10,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)", minWidth: 150,
          }}>
            <button
              onClick={() => setLayerOpen(v => !v)}
              style={{
                width: "100%", padding: "8px 12px", border: "none", background: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                Layer Peta
              </span>
              <span style={{ fontSize: 10 }}>{layerOpen ? "▲" : "▼"}</span>
            </button>
            {layerOpen && (
              <div style={{ padding: "4px 12px 10px", borderTop: "1px solid #f0f0f0", fontSize: 12 }}>
                <LayerCheck label="Batas DAS"       checked={layerVisibility.das}       onChange={() => setLayerVisibility(v => ({ ...v, das:       !v.das }))} />
                <LayerCheck label="Jaringan Sungai" checked={layerVisibility.sungai}    onChange={() => setLayerVisibility(v => ({ ...v, sungai:    !v.sungai }))} />
                <LayerCheck label="Batas Kecamatan" checked={layerVisibility.kecamatan} onChange={() => setLayerVisibility(v => ({ ...v, kecamatan: !v.kecamatan }))} />
              </div>
            )}
          </div>

          {/* Bottom panel — 1 kolom, chart di atas legend, TIDAK overlap */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
            display: "flex", flexDirection: "column",
            pointerEvents: "none",
          }}>
            {/* Chart - hanya muncul kalau ada station dipilih */}
            {selectedStation && selectedData && (
              <div style={{
                margin: "0 10px 6px",
                background: "#fff", borderRadius: 14,
                padding: "12px 14px",
                boxShadow: "0 -2px 20px rgba(0,0,0,0.15)",
                pointerEvents: "auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <b style={{ fontSize: 12 }}>Trend: {selectedStation.label}</b>
                  <button
                    onClick={() => setSelectedStation(null)}
                    style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", lineHeight: 1 }}
                  >✕</button>
                </div>
                <div style={{ height: 130 }}>
                  {selectedStation.type === "tma"
                    ? <MiniTMAChart data={selectedData} />
                    : <MiniCHChart  data={selectedData} />}
                </div>
              </div>
            )}

            {/* Legenda - selalu di paling bawah */}
            <div style={{
              background: "#fff",
              borderRadius: "14px 14px 0 0",
              padding: "10px 16px 14px",
              boxShadow: "0 -2px 12px rgba(0,0,0,0.1)",
              pointerEvents: "auto",
            }}>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", fontSize: 11 }}>
                <div style={{ flexShrink: 0 }}>
                  <b style={{ display: "block", marginBottom: 5 }}>TMA</b>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <Dot color="#38a169" /> Aman
                    <Dot color="#d69e2e" /> Waspada
                    <Dot color="#f97316" /> Siaga
                    <Dot color="#e53e3e" /> Bahaya
                  </div>
                </div>
                <div style={{ width: 1, background: "#e2e8f0", flexShrink: 0 }} />
                <div style={{ flexShrink: 0 }}>
                  <b style={{ display: "block", marginBottom: 5 }}>Curah Hujan</b>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <Dot color="#38a169" /> Tidak
                    <Dot color="#4299e1" /> Ringan
                    <Dot color="#d69e2e" /> Sedang
                    <Dot color="#ed8936" /> Lebat
                    <Dot color="#e53e3e" /> Sangat Lebat
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {showAlert && (
        <AlertModal status={alertStatus} stationName={alertStation} onClose={() => setShowAlert(false)} />
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

function Dot({ color }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, display: "inline-block", flexShrink: 0 }} />
  );
}

function LayerCheck({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}