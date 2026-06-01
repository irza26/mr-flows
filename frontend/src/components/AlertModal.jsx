import React from 'react';

const AlertTriangleIcon = ({ size = 52, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SirenIcon = ({ size = 52, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    <path d="M9 18h6"/><path d="M10 22h4"/>
    <line x1="12" y1="11" x2="12" y2="14"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const BellRingIcon = ({ size = 52, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    <path d="M2 8c0-2.2.7-4.3 2-6"/>
    <path d="M22 8a10 10 0 0 0-2-6"/>
  </svg>
);

export default function AlertModal({ onClose, status, stationName }) {
  const config = {
    "Bahaya":  { Icon: AlertTriangleIcon, title: "BAHAYA!",  color: "#e53e3e", bg: "#fff5f5", msg: "Potensi Banjir Segera!" },
    "Siaga":   { Icon: SirenIcon,         title: "SIAGA!",   color: "#f97316", bg: "#fff7ed", msg: "Waspadai Kenaikan Air!" },
    "Waspada": { Icon: BellRingIcon,      title: "WASPADA",  color: "#d97706", bg: "#fffbeb", msg: "Tinggi Air Mulai Naik!" }
  };

  const current = config[status] || config["Bahaya"];
  const { Icon } = current;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderColor: current.color }}>

        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          backgroundColor: current.bg, border: `2px solid ${current.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <Icon size={48} color={current.color} />
        </div>

        <h2 style={{ color: current.color, margin: '0 0 5px 0', fontWeight: '800', fontSize: '24px' }}>
          {current.title}
        </h2>

        <p style={{ color: '#718096', marginBottom: '15px', fontSize: '14px' }}>{stationName}</p>

        <div style={{
          backgroundColor: current.bg, color: current.color,
          padding: '12px', borderRadius: '12px', fontWeight: 'bold',
          marginBottom: '20px', border: `1px solid ${current.color}25`
        }}>
          {current.msg}
        </div>

        <button
          onClick={onClose}
          style={{
            cursor: 'pointer', width: '100%', padding: '14px',
            backgroundColor: current.color, color: 'white',
            border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px'
          }}
        >
          SAYA MENGERTI
        </button>
      </div>
    </div>
  );
}