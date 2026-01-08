export default function DetailPrediksi() {
  return (
    <div className="prediksi-layout">
      <div className="blue-hero">
        <p>Monitoring MR-FLOWS</p>
        <div className="accuracy-box"><h1>65%</h1><p>Prediksi Akurasi</p></div>
      </div>
      <div className="side-content">
        <div className="alert-box">
          <h4>Peringatan Sistem</h4>
          <ul><li>Ketinggian air mencapai level waspada</li></ul>
        </div>
        <div className="white-card">
          <h4>Data Prediksi Kedepan</h4>
          <table className="simple-table">
            <thead><tr><th>Lokasi</th><th>CH</th><th>KA</th></tr></thead>
            <tbody><tr><td>Bendungan A</td><td>32.5</td><td>1.2</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}