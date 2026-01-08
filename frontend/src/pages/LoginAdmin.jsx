import React, { useState } from 'react';
import logoMrFlows from '../assets/logo.png'; 

export default function LoginAdmin({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Login gagal");
        return;
      }

      const user = await res.json();

      localStorage.setItem("adminUser", JSON.stringify(user));

      setView("admin-panel");
    } catch {
      setError("Server tidak merespon");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={leftPanelStyle}>
        <div style={contentWrapperStyle}>
          <div style={brandHeaderStyle}>
            <div style={iconBoxStyle}>
                <img src={logoMrFlows} alt="Logo" style={{ width: '35px' }} />
            </div>
            <div>
              <h1 style={brandTitleStyle}>MR-FLOWS</h1>
              <p style={brandSubStyle}>Monitoring System</p>
            </div>
          </div>

          <div style={featureListStyle}>
            <FeatureItem icon="📈" title="Real-time Monitoring" desc="Pantau data curah hujan dan ketinggian air secara langsung 24/7" />
            <FeatureItem icon="🛡️" title="Early Warning System" desc="Sistem peringatan dini untuk mencegah risiko banjir di area monitoring" />
            <FeatureItem icon="📊" title="Predictive Analytics" desc="Analisis prediktif untuk memberikan insight yang akurat dan tepat waktu" />
          </div>
        </div>
      </div>

      <div style={rightPanelStyle}>
        <div style={formWrapperStyle}>
          <h2 style={welcomeTitleStyle}>Selamat Datang</h2>
          <p style={welcomeSubStyle}>Masuk ke dashboard MR-FLOWS untuk memantau sistem monitoring Anda</p>

          <form style={{ marginTop: '30px' }} onSubmit={handleLogin}>
            
            {error && (
              <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input 
                type="email" 
                placeholder="admin@mrflows.id" 
                style={inputStyle} 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••" 
                  style={inputStyle} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={eyeButtonStyle}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div style={formExtraStyle}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Ingat saya
              </label>
              <span style={{ color: '#00a8ff', fontWeight: '500', cursor: 'pointer' }}>Lupa password?</span>
            </div>

            <button type="submit" style={loginButtonStyle}>Masuk</button>
          </form>

          <div style={dividerStyle}><span>atau</span></div>

          <button style={googleButtonStyle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" width="18" alt="" />
            Masuk dengan Google
          </button>

          <p style={footerStyle}>© 2025 MR-FLOWS. All rights reserved.</p>
          
          <button onClick={() => setView('map')} style={backButtonStyle}>
            ← Kembali ke Peta
          </button>
        </div>
      </div>
    </div>
  );
}

const FeatureItem = ({ icon, title, desc }) => (
  <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'flex-start' }}>
    <div style={featureIconStyle}>{icon}</div>
    <div>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '700' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, lineHeight: '1.5' }}>{desc}</p>
    </div>
  </div>
);

const containerStyle = { display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" };
const leftPanelStyle = { flex: 1.2, background: 'linear-gradient(135deg, #2575fc 0%, #1757c4 100%)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' };
const contentWrapperStyle = { maxWidth: '450px' };
const brandHeaderStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '60px' };
const iconBoxStyle = { background: '#fcf8f8', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const brandTitleStyle = { margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '1px' };
const brandSubStyle = { margin: 0, fontSize: '12px', opacity: 0.7 };
const featureListStyle = { marginTop: '40px' };
const featureIconStyle = { background: 'rgba(255,255,255,0.15)', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 };
const rightPanelStyle = { flex: 1, backgroundColor: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' };
const formWrapperStyle = { width: '100%', maxWidth: '400px', textAlign: 'center' };
const welcomeTitleStyle = { fontSize: '32px', fontWeight: '700', color: '#1a202c', margin: '0 0 10px 0' };
const welcomeSubStyle = { color: '#718096', fontSize: '15px', lineHeight: '1.6' };
const inputGroupStyle = { marginBottom: '20px', textAlign: 'left' };
const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const eyeButtonStyle = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 };
const formExtraStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#718096', marginBottom: '25px' };
const loginButtonStyle = { width: '100%', padding: '14px', background: '#00a8ff', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 168, 255, 0.3)' };
const dividerStyle = { position: 'relative', margin: '30px 0', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'center' };
const googleButtonStyle = { width: '100%', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#4a5568' };
const footerStyle = { marginTop: '40px', fontSize: '12px', color: '#a0aec0' };
const backButtonStyle = { marginTop: '20px', background: 'none', border: 'none', color: '#00a8ff', fontSize: '13px', cursor: 'pointer' };