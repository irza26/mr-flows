import React, { useState, useEffect } from 'react';
import logoMrFlows from '../assets/logo.png'; 
import { getCHSidebar } from "../services/api";
import { getRainStatus } from "../utils/status";

export default function Sidebar({ onStationClick, setView }) {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Semua');

  useEffect(() => {
    const loadSidebarData = () => {
      getCHSidebar()
        .then(data => {
          setStations(data);
          setFilteredStations(data);
        })
        .catch(err => console.error("Gagal load sidebar:", err));
    };

    loadSidebarData();
    const interval = setInterval(loadSidebarData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFilter = (filterType) => {
    setActiveFilter(filterType);
    
    if (filterType === 'Semua') {
      setFilteredStations(stations);
      return;
    }

    const filtered = stations.filter(s => {
      const statusInfo = getRainStatus(s.rain_fall);
      return statusInfo.label === filterType;
    });

    setFilteredStations(filtered);
  };

  return (
    <aside className="sidebar" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0px' }}>
        <img 
          src={logoMrFlows} 
          alt="Logo MR-FLOWS" 
          style={{ 
            width: '40px', 
            height: '40px', 
            objectFit: 'cover',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0', 
            display: 'block' 
          }} 
        />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>MR-FLOWS</h2>
      </div>

      <div style={{ marginBottom: '0px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>Lokasi Monitoring</h3>
        <button 
          onClick={() => setView('map')}
          style={{ 
            width: '100%', backgroundColor: '#00a8ff', color: 'white', border: 'none',
            padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer'
          }}
        >
          <span>⊞</span> Dashboard
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Filter Status:</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['Semua', 'Aman', 'Ringan', 'Sedang', 'Lebat', 'Sangat Lebat'].map((f) => (
            <button 
              key={f}
              onClick={() => handleFilter(f)}
              style={activeFilter === f ? filterBtnStyleActive : filterBtnStyle}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredStations.length > 0 ? (
          filteredStations.map((s, i) => {
            const statusInfo = getRainStatus(s.rain_fall);
            return (
              <div 
                key={i} 
                onClick={() => onStationClick(s)} 
                style={{ 
                  padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s',
                  backgroundColor: statusInfo.bg,
                  border: `1px solid ${statusInfo.border}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#2d3748' }}>{s.name}</span>
                  <span>{statusInfo.bullet}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#4a5568', margin: '5px 0' }}>Curah Hujan: <b>{s.rain_fall} mm</b></p>
                <p style={{ fontSize: '11px', color: '#718096', margin: 0 }}>Terakhir: {s.time} WIB</p>
              </div>
            )
          })
        ) : (
          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '20px' }}>Tidak ada stasiun dengan status ini.</p>
        )}
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px' }}>
        <button
          style={bottomBtnStyle}
          onClick={() => {
            onStationClick({ name: "Bendung_Wanir" });
            setView("tma");
          }}
        >
          🌊 Monitoring Tinggi Air
        </button>
        <button style={{ ...bottomBtnStyle, marginTop: '10px' }}
        onClick={() => setView('login-admin')}
        >
          👤 Masuk
        </button>
      </div>
    </aside>
  );
}

const filterBtnStyle = { 
  padding: '6px 12px', 
  border: '1px solid #e2e8f0', 
  borderRadius: '20px', 
  backgroundColor: '#f7fafc', 
  color: '#4a5568', 
  fontSize: '10px', 
  cursor: 'pointer',
  fontWeight: '600',
  transition: '0.2s'
};

const filterBtnStyleActive = { 
  ...filterBtnStyle, 
  backgroundColor: '#00a8ff', 
  color: 'white',
  borderColor: '#00a8ff'
};

const bottomBtnStyle = { 
  width: '100%', 
  border: 'none', 
  background: 'none', 
  color: '#4a5568', 
  padding: '10px', 
  borderRadius: '8px', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  fontSize: '14px', 
  cursor: 'pointer',
  textAlign: 'left'
};