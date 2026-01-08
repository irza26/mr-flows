import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  GeoJSON
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";

import { getTMADashboard, getCHDashboard } from "../services/api";
import { getRainStatus, getTMAStatus } from "../utils/status";
import StationPopup from "./StationPopup";

const STATIONS = [
  { name: "Cihawuk", label: "PCH Cihawuk", type: "ch", lat: -7.185951, lon: 107.699982 },
  { name: "Cikitu", label: "PCH Cikitu", type: "ch", lat: -7.142651, lon: 107.691972 },
  { name: "Nagrak", label: "PCH Nagrak", type: "ch", lat: -7.127906, lon: 107.724088 },
  { name: "Ibun", label: "PCH Ibun", type: "ch", lat: -7.099045, lon: 107.763373 },
  { name: "Paseh Cipaku", label: "PCH Paseh Cipaku", type: "ch", lat: -7.056617, lon: 107.763847 },
  { name: "Kertasari", label: "PCH Kertasari", type: "ch", lat: -7.1919, lon: 107.676883 },
  { name: "Bendung_Wanir", label: "AWLR Bendung Wanir", type: "tma", lat: -7.050619, lon: 107.756644 }
];

const markerIcon = ({ type, color }) =>
  new L.DivIcon({
    className: "",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 14px rgba(0,0,0,0.35);
        position: relative;
      ">
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img 
            src="/icons/${type}.jpg"
            style="width: 18px; height: 18px; object-fit: contain;"
          />
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -36]
  });

export default function MapViewer() {
  const [dataMap, setDataMap] = useState({});
  const [dasGeo, setDasGeo] = useState(null);
  const [riverGeo, setRiverGeo] = useState(null);
  const [kecGeo, setKecGeo] = useState(null);

  const [layerVisibility, setLayerVisibility] = useState({
    das: false,
    sungai: false,
    kecamatan: true
  });


useEffect(() => {
  shp("/DAS/DAS.zip")
    .then(setDasGeo)
    .catch(err => console.error("DAS error:", err));

  shp("/Sungai/Sungai_DAS.zip") 
    .then(setRiverGeo) 
    .catch(err => console.error("Sungai error:", err));

  shp("/DAS/KEC.zip")
    .then(setKecGeo)
    .catch(err => console.error("KEC error:", err));
}, []);

  useEffect(() => {
    STATIONS.forEach((st) => {
      const fetcher = st.type === "tma" ? getTMADashboard : getCHDashboard;
      fetcher(st.name)
        .then((res) =>
          setDataMap((prev) => ({ ...prev, [st.label]: res }))
        )
        .catch(() => {});
    });
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer
        center={[-7.15, 107.74]}
        zoom={12}
        zoomControl={false}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {dasGeo && layerVisibility.das && (
          <GeoJSON
            data={dasGeo}
            style={{ color: "#000", weight: 3, fillOpacity: 0 }}
          />
        )}

        {riverGeo && layerVisibility.sungai && (
          <GeoJSON
            data={riverGeo}
            style={{ color: "#2563eb", weight: 2 }}
          />
        )}

        {kecGeo && layerVisibility.kecamatan && (
          <GeoJSON
            data={kecGeo}
            style={{ color: "#16a34a", weight: 1, dashArray: "4 4" }}
          />
        )}

        {STATIONS.map((st) => {
          const d = dataMap[st.label];
          if (!d) return null;

          const status =
            st.type === "tma"
              ? getTMAStatus(d.status)
              : getRainStatus(d.per_hour);

          return (
            <Marker
              key={st.label}
              position={[st.lat, st.lon]}
              icon={markerIcon({
                type: st.type,
                color: status.color
              })}
            >
              <Popup>
                <StationPopup station={st} data={d} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "#fff",
          padding: "12px 14px",
          borderRadius: 12,
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          fontSize: 12,
          zIndex: 1000,
          minWidth: 180
        }}
      >
        <b>Layer Peta</b>
        <hr />

        <LayerCheck
          label="Batas DAS"
          checked={layerVisibility.das}
          onChange={() =>
            setLayerVisibility(v => ({ ...v, das: !v.das }))
          }
        />

        <LayerCheck
          label="Jaringan Sungai"
          checked={layerVisibility.sungai}
          onChange={() =>
            setLayerVisibility(v => ({ ...v, sungai: !v.sungai }))
          }
        />

        <LayerCheck
          label="Batas Kecamatan"
          checked={layerVisibility.kecamatan}
          onChange={() =>
            setLayerVisibility(v => ({ ...v, kecamatan: !v.kecamatan }))
          }
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 12,
          width: 200,
          fontSize: 12,
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          zIndex: 1000
        }}
      >
        <b>Legenda</b>
        <hr />
        <b>TMA</b>
        <LegendItem color="#38a169" label="Aman" />
        <LegendItem color="#d69e2e" label="Waspada" />
        <LegendItem color="#e53e3e" label="Bahaya" />
        <hr />
        <b>Curah Hujan</b>
        <LegendItem color="#38a169" label="Tidak Hujan" />
        <LegendItem color="#4299e1" label="Ringan" />
        <LegendItem color="#d69e2e" label="Sedang" />
        <LegendItem color="#ed8936" label="Lebat" />
        <LegendItem color="#e53e3e" label="Sangat Lebat" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: color
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function LayerCheck({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        cursor: "pointer"
      }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

