import React, { useState, CSSProperties, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FeedbackPage() {
  const navigate = useNavigate();
  
  // State untuk deteksi layar HP agar padding tidak pecah
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    akurasiTMA: "",
    akurasiCH: "",
    pesan: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbzg8fqTOu_5uuW5PekdYD7qAkOsBgKKVzajGG9rTzZRZXnfgY07q9qpooCobv-sIu5F3Q/exec", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Feedback berhasil dikirim 🚀");
        navigate("/layanan");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal kirim feedback ❌");
    }
  };

  return (
    <div style={{
      ...containerStyle, 
      padding: isMobile ? "20px" : "40px 80px" // Hanya ubah padding di HP agar tidak sesak
    }}>
      <div style={navContainer}>
        <button 
          onClick={() => navigate("/layanan")} 
          style={backButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ← Kembali ke Layanan
        </button>
      </div>

      <div style={headerSection}>
        <h2 style={{ 
          fontSize: isMobile ? "32px" : "42px", // Sedikit lebih kecil di HP agar tidak overflow
          color: "#0f172a", 
          margin: "0 0 10px 0", 
          fontWeight: 800 
        }}>
          💬 Feedback <span style={{ color: "#10b981" }}>Pengguna</span>
        </h2>
        <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "700px" }}>
          Bantu kami melakukan kalibrasi model AI dengan memberikan laporan akurasi data di lokasi Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        ...formCard,
        padding: isMobile ? "25px" : "50px", // Padding form lebih kecil di HP
        width: "100%", // Pastikan lebar penuh
        boxSizing: "border-box" // Supaya padding tidak menambah lebar elemen
      }}>
        
        {/* Identitas */}
        <div style={{
          ...rowGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", // Di HP jadi 1 kolom, di PC tetap 2
          gap: isMobile ? "15px" : "40px"
        }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Nama Lengkap</label>
            <input 
              required
              style={inputStyle}
              placeholder="Masukkan nama Anda"
              value={formData.nama}
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Alamat / Lokasi Pemantauan</label>
            <input 
              required
              style={inputStyle}
              placeholder="Contoh: Dayeuhkolot, Bandung"
              value={formData.alamat}
              onChange={(e) => setFormData({...formData, alamat: e.target.value})}
            />
          </div>
        </div>

        <hr style={divider} />

        {/* Pertanyaan Akurasi */}
        <div style={{
          ...rowGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", // Di HP jadi 1 kolom, di PC tetap 2
          gap: isMobile ? "15px" : "40px"
        }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Akurasi Prediksi Ketinggian Air (TMA)</label>
            <p style={subLabel}>Apakah data di grafik sesuai dengan kondisi lapangan?</p>
            <div style={{
              ...radioGroup,
              flexDirection: isMobile ? "column" : "row" // Di HP radio button bertumpuk vertikal
            }}>
              <label style={radioLabel}>
                <input type="radio" name="tma" required onChange={() => setFormData({...formData, akurasiTMA: "Ya"})} /> 
                <span>✅ Sesuai</span>
              </label>
              <label style={radioLabel}>
                <input type="radio" name="tma" onChange={() => setFormData({...formData, akurasiTMA: "Tidak"})} /> 
                <span>❌ Tidak Sesuai</span>
              </label>
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Akurasi Prediksi Curah Hujan (WRF)</label>
            <p style={subLabel}>Apakah prediksi hujan sudah tepat sasaran?</p>
            <div style={{
              ...radioGroup,
              flexDirection: isMobile ? "column" : "row" // Di HP radio button bertumpuk vertikal
            }}>
              <label style={radioLabel}>
                <input type="radio" name="ch" required onChange={() => setFormData({...formData, akurasiCH: "Ya"})} /> 
                <span>✅ Sesuai</span>
              </label>
              <label style={radioLabel}>
                <input type="radio" name="ch" onChange={() => setFormData({...formData, akurasiCH: "Tidak"})} /> 
                <span>❌ Tidak Sesuai</span>
              </label>
            </div>
          </div>
        </div>

        <hr style={divider} />

        {/* Masukan UI/UX */}
        <div style={inputGroup}>
          <label style={labelStyle}>Masukan terkait Tampilan (UI) atau Pengalaman Pengguna (UX)</label>
          <textarea
            style={textareaStyle}
            rows={5}
            placeholder="Tuliskan saran, kritik, atau kendala yang Anda temui..."
            value={formData.pesan}
            onChange={(e) => setFormData({...formData, pesan: e.target.value})}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', marginTop: '20px' }}>
            <button type="submit" style={{
              ...submitButtonStyle,
              width: isMobile ? "100%" : "auto" // Di HP tombol jadi lebar penuh
            }}>
                Kirim Feedback Sekarang →
            </button>
        </div>

      </form>

      <div style={footerNote}>
        🛡️ Partisipasi Anda membantu ribuan orang mendapatkan peringatan dini yang lebih akurat.
      </div>
    </div>
  );
}

// --- STYLES ASLI (Tanpa perubahan warna/desain) ---

const containerStyle: CSSProperties = {
  background: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: "border-box"
};

const navContainer: CSSProperties = {
  marginBottom: "30px"
};

const backButtonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid #e2e8f0",
  padding: "10px 20px",
  borderRadius: "12px",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

const headerSection: CSSProperties = {
  marginBottom: "50px"
};

const formCard: CSSProperties = {
  background: "#fff",
  borderRadius: "32px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
  maxWidth: "1100px",
  margin: "0 auto",
};

const rowGrid: CSSProperties = {
  display: "grid",
  marginBottom: "10px"
};

const inputGroup: CSSProperties = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const labelStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#1e293b"
};

const subLabel: CSSProperties = {
  fontSize: "13px",
  color: "#94a3b8",
  margin: "-4px 0 8px 0"
};

const inputStyle: CSSProperties = {
  padding: "14px 18px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "15px",
  background: "#fcfdfe",
  outline: "none",
  transition: "border 0.2s",
};

const textareaStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "15px",
  background: "#fcfdfe",
  outline: "none",
  fontFamily: "inherit",
  resize: "vertical"
};

const radioGroup: CSSProperties = {
  display: "flex",
  gap: "20px",
};

const radioLabel: CSSProperties = {
  flex: 1,
  padding: "12px",
  border: "1px solid #f1f5f9",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  background: "#f8fafc",
};

const divider: CSSProperties = {
  border: "none",
  borderTop: "1px solid #f1f5f9",
  margin: "20px 0 30px 0"
};

const submitButtonStyle: CSSProperties = {
  padding: "16px 40px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)",
};

const footerNote: CSSProperties = {
  marginTop: "50px",
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center"
};