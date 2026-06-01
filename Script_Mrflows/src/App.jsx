import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";

import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import DetailDashboard from "./components/DetailDashboard";
import DashboardTMA from "./components/DashboardTMA";

// Import halaman dashboard baru kamu
import DashboardMapViewer from "./pages/DashboardMapViewer"; 

import LoginAdmin from "./pages/LoginAdmin";
import AdminPanel from "./pages/AdminPanel";

import LayananPage from "./LayananUser/LayananPage";
import FeedbackPage from "./LayananUser/FeedbackPage";
import NotifikasiPage from "./LayananUser/NotifikasiPage";

import { getTMADashboard } from "./services/api";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [latestTMA, setLatestTMA] = useState({
    last: 0,
    status: "Aman",
    last_time: "-"
  });

  const handleStationClick = (station) => {
    if (!station?.name) return;
    navigate(`/ch/${station.name}`);
  };

  useEffect(() => {
    getTMADashboard("Bendung_Wanir")
      .then((json) => {
        if (!json?.error) setLatestTMA(json);
      })
      .catch(console.error);
  }, []);

  // Sembunyikan sidebar bawaan di halaman utama baru, layanan, dan admin
  const hideSidebar =
    location.pathname === "/" || 
    location.pathname === "/login" ||
    location.pathname === "/admin" ||
    location.pathname === "/layanan" ||
    location.pathname === "/layanan/feedback" ||
    location.pathname === "/layanan/notifikasi";

  const setView = (target) => {
    if (target === "map") navigate("/map-viewer"); // Mengarah ke map viewer lama
    if (target === "tma") navigate("/tma");
    if (target === "login-admin") navigate("/login");
    if (target === "admin-panel") navigate("/admin");
  };

  return (
    <div className="dashboard-container">
      {!hideSidebar && (
        <div className="sidebar-wrapper">
          <Sidebar
            setView={setView}
            tmaInfo={latestTMA}
            onStationClick={handleStationClick}
          />
        </div>
      )}
      
      {/* Lepas wrapper map-wrapper kalau di halaman utama baru biar grid-nya full screen */}
      <div className={location.pathname === "/" ? "" : "map-wrapper"}>
        <Routes>
          {/* 1. HALAMAN UTAMA BARU (YANG PERTAMA KALI MUNCUL) */}
          <Route path="/" element={<DashboardMapViewer />} />

          {/* 2. HALAMAN MAP VIEWER AWAL / LAMA */}
          <Route path="/map-viewer" element={<MapViewer />} />
          
          <Route path="/ch/:station" element={<DetailDashboard />} />
          <Route path="/tma" element={<DashboardTMA />} />

          <Route path="/layanan" element={<LayananPage />} />
          <Route path="/layanan/feedback" element={<FeedbackPage />} /> 
          <Route path="/layanan/notifikasi" element={<NotifikasiPage />} /> 

          <Route path="/login" element={<LoginAdmin setView={setView} />} />
          <Route path="/admin" element={<AdminPanel setView={setView} />} />
        </Routes>
      </div>
    </div>
  );
}