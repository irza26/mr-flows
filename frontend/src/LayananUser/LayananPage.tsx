import React, { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

export default function LayananPage() {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      {/* Tombol Kembali */}
      <div style={navContainer}>
        <button 
          onClick={() => navigate("/")} 
          style={backButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ← Kembali ke Beranda
        </button>
        
        <div style={systemStatus}>
          <span style={{ color: "#10b981" }}>●</span>
          <span>Sistem Aktif: {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      <div style={headerSection}>
        <h2 style={{ fontSize: "38px", color: "#0f172a", margin: "0 0 12px 0", fontWeight: 800 }}>
          Pusat Layanan <span style={{ color: "#3b82f6" }}>Mitigasi</span>
        </h2>
        <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "550px", lineHeight: "1.7" }}>
          Pilih layanan MR-FLOWS untuk membantu kamu tetap aman dan mendapatkan informasi peringatan dini secara cepat.
        </p>
      </div>

      <div style={gridStyle}>
        
        {/* 🔔 NOTIFIKASI */}
        <div
          onClick={() => navigate("/layanan/notifikasi")}
          style={cardStyle}
          className="hover-card"
        >
          <div style={accentBar("#3b82f6")}></div>
          <div style={iconBox("#3b82f6")}>
            <span style={{ fontSize: "32px" }}>🔔</span>
          </div>
          <h3 style={cardTitle}>Notifikasi Bencana</h3>
          <p style={cardDesc}>
            Daftar buat dapet peringatan dini otomatis kalau ada potensi banjir atau hujan ekstrem lewat email atau WhatsApp kamu.
          </p>
          <div style={actionButton}>
            <span>Buka Layanan</span>
            <span>→</span>
          </div>
        </div>

        {/* 💬 FEEDBACK */}
        <div
          onClick={() => navigate("/layanan/feedback")}
          style={cardStyle}
          className="hover-card"
        >
          <div style={accentBar("#10b981")}></div>
          <div style={iconBox("#10b981")}>
            <span style={{ fontSize: "32px" }}>💬</span>
          </div>
          <h3 style={cardTitle}>Feedback & Laporan</h3>
          <p style={cardDesc}>
            Ada kendala atau mau lapor kondisi lapangan? Kirim saran dan kritik kamu buat bantu kami kembangin fitur MR-FLOWS.
          </p>
          <div style={actionButton}>
            <span>Kirim Laporan</span>
            <span>→</span>
          </div>
        </div>

      </div>

      {/* Footer buat hiasan biar gak sepi bawahnya */}
      <div style={footerNote}>
        🛡️ <span>Data kamu aman dan dienkripsi oleh sistem AI MR-FLOWS.</span>
      </div>

      <style>
        {`
          .hover-card {
            transition: all 0.3s ease;
          }
          .hover-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            border-color: #3b82f6 !important;
          }
        `}
      </style>
    </div>
  );
}

// --- STYLES (TSX SAFE) ---

const containerStyle: CSSProperties = {
  padding: "50px 60px",
  background: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  position: "relative"
};

const navContainer: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "50px"
};

const systemStatus: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  background: "#fff",
  borderRadius: "20px",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: 600,
  border: "1px solid #e2e8f0"
};

const backButtonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid #e2e8f0",
  padding: "10px 18px",
  borderRadius: "12px",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.2s"
};

const headerSection: CSSProperties = {
  marginBottom: "60px"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "30px"
};

const accentBar = (color: string): CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "5px",
  backgroundColor: color,
  borderRadius: "20px 20px 0 0"
});

const cardStyle: CSSProperties = {
  background: "#fff",
  padding: "40px",
  borderRadius: "20px",
  cursor: "pointer",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
};

const iconBox = (color: string): CSSProperties => ({
  width: "65px",
  height: "65px",
  borderRadius: "18px",
  backgroundColor: color + "10",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px"
});

const cardTitle: CSSProperties = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: "0 0 12px 0"
};

const cardDesc: CSSProperties = {
  fontSize: "15px",
  color: "#64748b",
  lineHeight: "1.7",
  margin: "0 0 30px 0",
  flex: 1
};

const actionButton: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#3b82f6"
};

const footerNote: CSSProperties = {
  marginTop: "100px",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "13px",
  display: "flex",
  justifyContent: "center",
  gap: "8px"
};