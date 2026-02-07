# MrFlows – Platform Pemantauan Banjir
MrFlows adalah platform pemantauan banjir berbasis web yang dirancang untuk memvisualisasikan dan memantau data **curah hujan** dan **tinggi muka air (TMA)** secara real-time. Sistem ini mengintegrasikan proses pengambilan data otomatis, backend API, serta visualisasi peta interaktif untuk mendukung pemantauan banjir dan sistem peringatan dini (early warning).
Saat ini, proyek MrFlows sedang dikembangkan dan diimplementasikan secara berkelanjutan dalam kolaborasi dengan PT Samudra Sains Teknologi, dengan fokus pada penguatan sistem pemantauan hidrologi, integrasi data lapangan, serta pengembangan fitur pendukung sistem peringatan dini banjir.

## Teknologi yang Digunakan

### Frontend
- **React**
- **Vite**
- **JavaScript**
- **Peta Interaktif (OpenstreetMap)** (visualisasi berbasis peta)
- Lingkungan pengembangan **Node.js**

### Backend
- **Python**
- **FastAPI**
- Arsitektur RESTful API

### Basis Data
- **PostgreSQL**

### Pipeline Data
- Scraping data otomatis dari sumber **BBWS / Jaga Balai**
- Validasi dan pra-pemrosesan data
- Penyimpanan data berbasis waktu (timestamp) dan lokasi stasiun

## Fitur Utama

- Pemantauan curah hujan secara real-time  
- Pemantauan tinggi muka air (TMA)  
- Visualisasi data berbasis peta interaktif  
- Pengambilan dan pembaruan data otomatis  
- Indikator **early warning** potensi banjir  
- Penyajian data melalui API untuk kebutuhan frontend  
