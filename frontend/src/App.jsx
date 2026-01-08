import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";

import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import DetailDashboard from "./components/DetailDashboard";
import DashboardTMA from "./components/DashboardTMA";

import LoginAdmin from "./pages/LoginAdmin";
import AdminPanel from "./pages/AdminPanel";

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

  const hideSidebar =
  location.pathname === "/login" ||
  location.pathname === "/admin";

  const setView = (target) => {
    if (target === "map") navigate("/");
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
      <div className="map-wrapper">
        <Routes>
          <Route path="/" element={<MapViewer />} />
          <Route path="/ch/:station" element={<DetailDashboard />} />
          <Route path="/tma" element={<DashboardTMA />} />
          <Route path="/login" element={<LoginAdmin setView={setView} />} />
          <Route path="/admin" element={<AdminPanel setView={setView} />} />
        </Routes>
      </div>
    </div>
  );
}

