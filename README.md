# AI Task Manager

AI-powered task manager yang terintegrasi dengan Google Calendar dan mendukung voice input.

## ✨ Fitur

- 🤖 **AI Processing**: Analisis tugas otomatis dengan kategori dan saran
- 📅 **Google Calendar**: Sinkronisasi otomatis dengan Google Calendar
- 🔍 **Search & Filter**: Cari dan filter tugas berdasarkan prioritas
- 💾 **Local Storage**: Penyimpanan data lokal otomatis
- 📱 **Responsive**: Tampilan yang responsif untuk semua device

## 🚀 Cara Menjalankan

### 1. Download/Clone Files
Buat folder `ai-task-manager` dan salin semua file di atas.

### 2. Setup Google Calendar API

1. **Buka Google Cloud Console**:
   - Kunjungi https://console.cloud.google.com
   - Buat project baru atau pilih project yang ada

2. **Aktifkan Google Calendar API**:
   - Di sidebar, pilih "APIs & Services" > "Library"
   - Cari "Google Calendar API" dan aktifkan

3. **Buat Credentials**:
   - Pilih "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "API Key"
   - Copy API Key yang dihasilkan
   
4. **Buat OAuth 2.0 Client ID**:
   - Klik "Create Credentials" > "OAuth client ID"
   - Pilih "Web application"
   - Tambahkan origin: `http://localhost:3000` (atau port yang Anda gunakan)
   - Copy Client ID yang dihasilkan

5. **Update config.js**:
   ```javascript
   const GOOGLE_CONFIG = {
       API_KEY: 'AIzaSy...', // API Key Anda
       CLIENT_ID: '123456789-abc.apps.googleusercontent.com', // Client ID Anda
       DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
       SCOPES: 'https://www.googleapis.com/auth/calendar'
   };
