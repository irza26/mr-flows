import React, { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

// Ikon Telegram SVG
const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function NotifikasiPage() {
  const navigate = useNavigate();

  // Ganti dengan username channel kamu (pake t.me/)
  const CHANNEL_URL = "https://t.me/+q9wCXEN_uP45OGVl"; 

  return (
    <div style={containerStyle}>
      {/* Navigasi */}
      <div style={navContainer}>
        <button 
          onClick={() => navigate("/layanan")} 
          style={backButtonStyle}
        >
          ← Kembali ke Layanan
        </button>
      </div>

      {/* Main Content */}
      <div style={contentWrapper}>
        <div style={cardSection}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔔</div>
          
          <h2 style={titleStyle}>
            Notifikasi <span style={{ color: "#3b82f6" }}>Real-time</span>
          </h2>
          
          <p style={descriptionStyle}>
            Dapatkan peringatan dini langsung di ponsel Anda. Bergabunglah dengan Channel Telegram 
            resmi <b>MR-FLOWS</b> untuk memantau kenaikan muka air dan cuaca ekstrem di wilayah Majalaya.
          </p>

          <div style={featureGrid}>
            <div style={featureItem}>✅ Gratis & Cepat</div>
            <div style={featureItem}>✅ Update Otomatis AI</div>
            <div style={featureItem}>✅ Siaga 24/7</div>
          </div>

          <a 
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={joinButtonStyle}
          >
            <TelegramIcon />
            Gabung Channel Telegram Sekarang
          </a>

          <p style={footerNote}>
            *Klik tombol di atas, lalu tekan <b>JOIN</b> pada aplikasi Telegram Anda.
          </p>
        </div>

        <div style={infoBanner}>
          <div style={{ color: "#3b82f6", fontWeight: "800", marginBottom: "5px" }}>🛡️ PRIVASI TERJAMIN</div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Nomor telepon dan identitas Anda tidak akan terlihat oleh anggota lain di dalam Channel.
          </p>
        </div>
      </div>

      <div style={bottomCredit}>
        Sistem ini menggunakan pemantauan sensor real-time Majalaya & Model Klasifikasi AI.
      </div>
    </div>
  );
}

// --- STYLES ---

const containerStyle: CSSProperties = {
  padding: "40px 20px",
  background: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const navContainer: CSSProperties = {
  width: "100%",
  maxWidth: "800px",
  marginBottom: "40px"
};

const backButtonStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  padding: "10px 20px",
  borderRadius: "12px",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
};

const contentWrapper: CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  textAlign: "center",
};

const cardSection: CSSProperties = {
  background: "#fff",
  padding: "60px 40px",
  borderRadius: "32px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)",
  marginBottom: "20px",
};

const titleStyle: CSSProperties = {
  fontSize: "42px",
  color: "#0f172a",
  margin: "0 0 20px 0",
  fontWeight: 800,
  letterSpacing: "-1px"
};

const descriptionStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "17px",
  lineHeight: "1.7",
  marginBottom: "30px"
};

const featureGrid: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "40px",
  flexWrap: "wrap"
};

const featureItem: CSSProperties = {
  background: "#f1f5f9",
  padding: "8px 16px",
  borderRadius: "50px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#475569"
};

const joinButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  padding: "20px 40px",
  background: "#0088cc", // Warna khas Telegram
  color: "#fff",
  borderRadius: "20px",
  fontSize: "18px",
  fontWeight: "700",
  textDecoration: "none",
  transition: "transform 0.2s, box-shadow 0.2s",
  boxShadow: "0 10px 20px rgba(0,136,204,0.3)",
};

const footerNote: CSSProperties = {
  marginTop: "20px",
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "500"
};

const infoBanner: CSSProperties = {
  background: "#eff6ff",
  padding: "20px",
  borderRadius: "20px",
  border: "1px solid #dbeafe",
  textAlign: "left"
};

const bottomCredit: CSSProperties = {
  marginTop: "60px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "1px"
};