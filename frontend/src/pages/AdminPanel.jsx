import React, { useState, useEffect } from "react";
import logoMrFlows from "../assets/logo.png";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  getStations,
  syncStations,
  updateStationStatus,
  cleanupRainfall,
  cleanupTmaDuplicate,
  getCHSidebar,
  getCHDashboard
} from "../services/api";

export default function AdminPanel({ setView }) {
  const [stationsKelola, setStationsKelola] = useState([]);
  
  const [laporanStations, setLaporanStations] = useState([]);
  const [chData, setChData] = useState([]);
  const [stats, setStats] = useState(null); 
  const [selectedStation, setSelectedStation] = useState("");
  const [periode, setPeriode] = useState(24); 

  const [activeTab, setActiveTab] = useState("kelola");
  const [tmaRules, setTmaRules] = useState([]);
  const [loadingSync, setLoadingSync] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const opt = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    const d = date.toLocaleDateString("id-ID", opt);
    const t = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${d} - ${t} WIB`;
  };

  useEffect(() => {
    if (activeTab === "kelola") {
      getStations().then(setStationsKelola).catch(console.error);
    }
  }, [activeTab]);

  useEffect(() => {
    getCHSidebar()
      .then(data => {
        setLaporanStations(data);
        if (data.length > 0) {
          setSelectedStation(prev => prev || data[0].name);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab !== "laporan" || !selectedStation) return;
    
    getCHDashboard(selectedStation)
      .then(json => {
        if (!json?.error) {
          setChData(json.chart || []);
          setStats({
            current: json.current,
            per_hour: json.per_hour,
            daily: json.daily,
            prediction: json.prediction,
            last_time: json.last_time
          });
        }
      })
      .catch(console.error);
  }, [activeTab, selectedStation]);

  useEffect(() => {
    if (activeTab !== "threshold") return;
    fetch("http://127.0.0.1:8000/alerts/")
      .then(res => res.json())
      .then(data => {
        const tmaOnly = data
          .filter(r => r[2] === "tma")
          .map(r => ({ id: r[0], label: r[1], threshold: Number(r[4]) }))
          .sort((a, b) => a.threshold - b.threshold);
        setTmaRules(tmaOnly);
      })
      .catch(console.error);
  }, [activeTab]);

  const getFilteredData = () => {
    if (!chData || chData.length === 0) return [];
    const totalPoints = chData.length;
    const pointsToShow = Math.floor((periode / 24) * totalPoints);
    return chData.slice(-pointsToShow);
  };

  const handleSyncStations = async () => {
    try {
      setLoadingSync(true);
      await syncStations();
      await updateStationStatus();
      const data = await getStations();
      setStationsKelola(data);
      alert("Sinkronisasi stasiun berhasil");
    } catch {
      alert("Gagal sinkronisasi stasiun");
    } finally {
      setLoadingSync(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Apakah Anda yakin ingin logout?")) return;
    localStorage.removeItem("adminUser");
    setView("map");
  };

  return (
    <div style={styles.layout}>
      <style>{`
        @media print { aside { display: none !important; } main { padding: 0 !important; } .no-print { display: none !important; } body { background: white !important; } }
        button:hover { opacity: 0.85; transform: translateY(-1px); transition: 0.2s; }
      `}</style>

      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}><img src={logoMrFlows} alt="logo" width={24} /></div>
          <span style={{ fontWeight: 800, color: "#1e293b", letterSpacing: '0.5px' }}>MR-ADMIN</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div onClick={() => setActiveTab("kelola")} style={styles.nav(activeTab === "kelola")}>Kelola Stasiun</div>
          <div onClick={() => setActiveTab("laporan")} style={styles.nav(activeTab === "laporan")}>Laporan Data</div>
          <div onClick={() => setActiveTab("threshold")} style={styles.nav(activeTab === "threshold")}>Threshold TMA</div>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>Keluar</button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {activeTab === "kelola" && "Dashboard Status Stasiun"}
              {activeTab === "laporan" && "Analisis Curah Hujan"}
              {activeTab === "threshold" && "Konfigurasi Threshold"}
            </h1>
            <p style={styles.subtitle}>Sistem Monitoring Banjir Real-time</p>
          </div>

          <div style={styles.adminInfo}>
            <span style={styles.dateTimeText}>{formatDateTime(currentTime)}</span>
            <div style={styles.profileBox}>
              <div style={styles.avatar}>A</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={styles.adminName}>Admin User</span>
                <span style={styles.adminRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.contentCard}>
          {activeTab === "kelola" && (
            <>
              <div style={styles.actionRow} className="no-print">
                <button onClick={handleSyncStations} style={styles.primaryBtn}>
                  🔄 {loadingSync ? "Menyinkronkan..." : "Sinkronisasi Stasiun"}
                </button>
                <button onClick={() => cleanupRainfall().then(r => alert(`Data CH dihapus: ${r.deleted_rows}`))} style={styles.dangerBtn}>🧹 Bersihkan Data CH</button>
                <button onClick={() => cleanupTmaDuplicate().then(r => alert(`Data TMA dihapus: ${r.deleted_rows}`))} style={styles.warnBtn}>🧹 Bersihkan Data TMA</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>STASIUN</th>
                      <th style={styles.th}>SUMBER</th>
                      <th style={styles.th}>STATUS ALAT</th>
                      <th style={styles.th}>UPDATE TERAKHIR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stationsKelola.map((s, i) => (
                      <tr key={i}>
                        <td style={styles.td}><b>{s.station_name}</b></td>
                        <td style={styles.td}><span style={{fontSize: 12, color: '#64748b'}}>{s.source?.toUpperCase()}</span></td>
                        <td style={styles.td}>
                          <span style={styles.badge(s.status === "aktif")}>{s.status === "aktif" ? "AKTIF" : "OFF"}</span>
                        </td>
                        <td style={styles.td}>{s.last_update || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "laporan" && (
            <>
              <div style={styles.filterBar} className="no-print">
                <div style={{ display: 'flex', gap: 10 }}>
                  <select style={styles.select} value={periode} onChange={e => setPeriode(+e.target.value)}>
                    <option value={6}>6 Jam Terakhir</option>
                    <option value={12}>12 Jam Terakhir</option>
                    <option value={24}>24 Jam Terakhir</option>
                  </select>

                  <select style={styles.select} value={selectedStation} onChange={e => setSelectedStation(e.target.value)}>
                    {laporanStations.map((s, i) => (
                      <option key={i} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => window.print()} style={styles.printBtn}>🖨️ Cetak Laporan</button>
              </div>

              {stats && (
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Curah Hujan Saat Ini</span>
                    <span style={styles.statValue}>{stats.current} mm</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total 24 Jam</span>
                    <span style={styles.statValue}>{stats.daily} mm</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Prediksi (6 Jam)</span>
                    <span style={styles.statValue}>{stats.prediction} mm</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Update Terakhir</span>
                    <span style={styles.statValue}>{stats.last_time?.split(" ")[1]}</span>
                  </div>
                </div>
              )}

              <div style={styles.chartContainer}>
                <h3 style={{ marginBottom: 20, color: '#475569', fontSize: 16 }}>Grafik Histori {periode} Jam: {selectedStation}</h3>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getFilteredData()}>
                      <defs>
                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={40} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Area type="monotone" dataKey="rain_fall" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === "threshold" && (
            <div style={{ maxWidth: 500 }}>
              <p style={{ marginBottom: 25, color: '#64748b', fontSize: 14 }}>Atur batas ketinggian air (meter) untuk klasifikasi status siaga.</p>
              {tmaRules.map((r, i) => (
                <div key={r.id} style={styles.inputRow}>
                  <label style={styles.inputLabel}>{r.label}</label>
                  <div style={styles.inputWrapper}>
                    <input type="number" step="0.01" value={r.threshold} onChange={e => {
                      const copy = [...tmaRules]; copy[i].threshold = Number(e.target.value); setTmaRules(copy);
                    }} style={styles.inputField} />
                    <span style={styles.unitLabel}>meter</span>
                  </div>
                </div>
              ))}
              <button style={styles.saveBtn}>Simpan Konfigurasi</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: { display: "flex", height: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  sidebar: { width: 280, padding: "30px 20px", backgroundColor: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" },
  logoWrap: { display: "flex", gap: 12, alignItems: "center", marginBottom: 40, paddingLeft: 10 },
  logoCircle: { background: "#eff6ff", padding: 8, borderRadius: 10 },
  nav: active => ({ padding: "14px 18px", marginBottom: 8, borderRadius: 12, cursor: "pointer", fontSize: "14px", fontWeight: active ? "600" : "500", background: active ? "#3b82f6" : "transparent", color: active ? "white" : "#64748b", boxShadow: active ? "0 4px 12px rgba(59, 130, 246, 0.2)" : "none", transition: "0.2s" }),
  logoutBtn: { padding: 12, borderRadius: 10, border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", fontWeight: "600", cursor: "pointer" },
  main: { flex: 1, padding: "40px 60px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 35 },
  title: { margin: 0, fontSize: "28px", color: "#1e293b", fontWeight: "800" },
  subtitle: { margin: "4px 0 0 0", color: "#94a3b8", fontSize: "14px" },
  adminInfo: { display: "flex", alignItems: "center", gap: 25 },
  dateTimeText: { color: "#64748b", fontSize: "13px", fontWeight: "500" },
  profileBox: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: "50%", backgroundColor: "#0ea5e9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
  adminName: { fontSize: "14px", fontWeight: "700", color: "#1e293b", lineHeight: 1.2 },
  adminRole: { fontSize: "12px", color: "#94a3b8" },
  contentCard: { background: "white", padding: 30, borderRadius: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  actionRow: { display: "flex", gap: 12, marginBottom: 25 },
  primaryBtn: { padding: "10px 20px", borderRadius: 12, background: "#3b82f6", color: "white", border: "none", fontWeight: 600, cursor: "pointer" },
  dangerBtn: { padding: "10px 20px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", fontWeight: 600, cursor: "pointer" },
  warnBtn: { padding: "10px 20px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706", fontWeight: 600, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "16px", color: "#94a3b8", fontSize: "12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 },
  td: { padding: "16px", fontSize: "14px", color: "#334155", borderBottom: "1px solid #f1f5f9" },
  badge: active => ({ padding: "4px 12px", borderRadius: 20, fontSize: "11px", fontWeight: "700", background: active ? "#f0fdf4" : "#fef2f2", color: active ? "#22c55e" : "#ef4444", border: active ? "1px solid #bbf7d0" : "1px solid #fecaca" }),
  filterBar: { display: "flex", justifyContent: "space-between", marginBottom: 25 },
  select: { padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", color: "#475569", fontSize: 14 },
  printBtn: { padding: "10px 20px", background: "#1e293b", color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, marginBottom: 25 },
  statItem: { padding: 15, background: "#f8fafc", borderRadius: 15, display: "flex", flexDirection: "column" },
  statLabel: { fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 600 },
  statValue: { fontSize: 16, color: "#1e293b", fontWeight: 800 },
  chartContainer: { padding: 20, border: "1px solid #f1f5f9", borderRadius: 20 },
  tooltip: { borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
  inputRow: { display: "flex", alignItems: "center", marginBottom: 20 },
  inputLabel: { flex: 1, fontWeight: 600, color: '#334155', fontSize: 14 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputField: { width: "130px", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 15, paddingRight: 60 },
  unitLabel: { position: 'absolute', right: 15, color: '#94a3b8', fontSize: 12 },
  saveBtn: { marginTop: 15, width: '100%', padding: "14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }
};