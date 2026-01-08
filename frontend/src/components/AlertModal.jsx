import React from 'react';

export default function AlertModal({ onClose, status, stationName }) {
  const config = {
    "Bahaya": { icon: "⚠️", title: "BAHAYA!", color: "#e53e3e", msg: "Potensi Banjir!" },
    "Waspada": { icon: "🔔", title: "WASPADA", color: "#d97706", msg: "Air Naik!" }
  };

  const current = config[status] || config["Bahaya"];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderColor: current.color }}>
        <div style={{ fontSize: '70px', marginBottom: '10px' }}>{current.icon}</div>
        
        <h2 style={{ color: current.color, margin: '0 0 5px 0', fontWeight: '800' }}>
          {current.title}
        </h2>
        
        <p style={{ color: '#718096', marginBottom: '15px' }}>{stationName}</p>

        <div style={{ 
          backgroundColor: '#fef2f2', color: current.color, 
          padding: '12px', borderRadius: '12px', fontWeight: 'bold', 
          marginBottom: '20px' 
        }}>
          {current.msg}
        </div>

        <button 
          onClick={onClose}
          style={{ 
            cursor: 'pointer', width: '100%', padding: '14px', 
            backgroundColor: current.color, color: 'white', 
            border: 'none', borderRadius: '12px', fontWeight: 'bold' 
          }}
        >
          SAYA MENGERTI
        </button>
      </div>
    </div>
  );
}