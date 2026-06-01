import React, { useState, useEffect } from 'react';
import logoMrFlows from '../assets/logo.png'; 
import { getCHSidebar } from "../services/api";
import { getRainStatus } from "../utils/status";

export default function Sidebar({ onStationClick, setView }) {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Semua');
  
  // State untuk deteksi mobile dan buka/tutup menu
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Jika layar dikecilkan ke mobile, otomatis tutup menu
      // Jika layar dibesarkan ke desktop, otomatis buka menu
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);

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

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
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
    <>
      {/* 1. TOMBOL HAMBURGER (Hanya muncul di HP) */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed', 
            top: '15px', 
            left: '15px', 
            zIndex: 1100,
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            padding: '10px', 
            fontSize: '20px', 
            cursor: 'pointer', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {/* 2. SIDEBAR UTAMA */}
      <aside className="sidebar" style={{ 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: isMobile ? '280px' : '320px',
        boxSizing: 'border-box', 
        backgroundColor: 'white',
        borderRight: '1px solid #eee',
        
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isOpen ? '0' : (isMobile ? '-320px' : '0'), 
        
        visibility: !isOpen && isMobile ? 'hidden' : 'visible',
        opacity: !isOpen && isMobile ? 0 : 1,
        
        transition: 'all 0.3s ease-in-out',
        zIndex: 1050,
        boxShadow: isMobile && isOpen ? '5px 0 15px rgba(0,0,0,0.1)' : 'none'
      }}>
        
        {/* HEADER: Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', marginTop: isMobile ? '40px' : '0' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', lineHeight: '1.2' }}>
              MR-FLOWS
            </h2>
            <span style={{ fontSize: '9px', color: '#666', lineHeight: '1.2' }}>
              Majalaya River Flood Warning System
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>Lokasi Monitoring</h3>
          <button 
            onClick={() => {
                setView('map');
                if(isMobile) setIsOpen(false);
            }}
            style={{ 
              width: '100%', backgroundColor: '#00a8ff', color: 'white', border: 'none',
              padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            <span>⊞</span> Dashboard
          </button>
        </div>

        {/* FILTER STATUS */}
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

        {/* LIST STASIUN (SCROLLABLE) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredStations.length > 0 ? (
            filteredStations.map((s, i) => {
              const statusInfo = getRainStatus(s.rain_fall);
              return (
                <div 
                  key={i} 
                  onClick={() => {
                      onStationClick(s);
                      if(isMobile) setIsOpen(false);
                  }} 
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
            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '20px' }}>Tidak ada data.</p>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px' }}>
          <button
            style={bottomBtnStyle}
            onClick={() => {
              onStationClick({ name: "Bendung_Wanir" });
              setView("tma");
              if(isMobile) setIsOpen(false);
            }}
          >
            🌊 Monitoring Tinggi Air
          </button>

          <button style={{ ...bottomBtnStyle, marginTop: '10px' }}
            onClick={() => setView('login-admin')}
          >
            👤 Masuk (Admin)
          </button>
        </div>
      </aside>

      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed', 
            top: '15px', 
            left: '15px', 
            zIndex: 2000, 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}
    </>
  );
}

// STYLES
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