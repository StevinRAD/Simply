# Simply Browser Extension

Extension browser untuk Simply Dashboard yang memungkinkan akses mudah ke semua service dengan auto-login menggunakan cookie injection.

## 📦 Struktur Extension

Project ini terdiri dari 2 extension yang bekerja bersama:

### 1. Simply Guard (Security Extension)
Extension keamanan yang harus diinstall terlebih dahulu untuk melindungi akun user.

**Fitur:**
- 🔒 Memblokir akses ke halaman account & billing Netflix
- 🚫 Mendeteksi dan menonaktifkan cookie editor extension
- 🛡️ Proteksi otomatis saat browsing
- ⚡ Ringan dan tidak mengganggu performa

**Files:**
- `extensions/guard/manifest.json` - Konfigurasi extension
- `extensions/guard/background.js` - Service worker untuk deteksi extension
- `extensions/guard/content.js` - Script untuk monitoring halaman
- `extensions/guard/rules.json` - Declarative rules untuk blocking

### 2. Simply Main (Main Extension)
Extension utama untuk mengakses service dengan auto-login.

**Fitur:**
- ⚡ Akses service dengan 1 klik
- 🔐 Auto-login dengan cookie injection
- 📱 Popup UI yang modern dan mudah digunakan
- 🔄 Sync otomatis dengan dashboard
- 🔍 Search dan filter service
- 📊 Monitoring login status

**Files:**
- `extensions/main/manifest.json` - Konfigurasi extension
- `extensions/main/background.js` - Service worker untuk komunikasi Supabase
- `extensions/main/content.js` - Script untuk inject cookies dan monitoring
- `extensions/main/popup.html` - UI popup
- `extensions/main/popup.css` - Styling popup
- `extensions/main/popup.js` - Logic popup

## 🚀 Instalasi

### Prasyarat
- Chrome/Edge browser (Manifest V3 compatible)
- Akun Simply Dashboard yang sudah login
- Developer mode enabled di browser

### Langkah Instalasi

1. **Clone atau Download Project**
   ```bash
   git clone <repository-url>
   cd simply
   ```

2. **Buka Chrome Extensions**
   - Buka browser Chrome/Edge
   - Ketik `chrome://extensions` di address bar
   - Aktifkan "Developer mode" di pojok kanan atas

3. **Install Simply Guard (WAJIB PERTAMA)**
   - Klik "Load unpacked"
   - Pilih folder `extensions/guard`
   - Pastikan extension aktif (toggle switch ON)

4. **Install Simply Main**
   - Klik "Load unpacked" lagi
   - Pilih folder `extensions/main`
   - Pastikan extension aktif (toggle switch ON)

5. **Pin Extension**
   - Klik icon puzzle di toolbar browser
   - Pin "Simply Main" untuk akses cepat

6. **Selesai!**
   - Klik icon Simply Main di toolbar
   - Extension akan otomatis sync dengan dashboard Anda

## ⚙️ Konfigurasi

### Supabase Configuration

Edit file `extensions/main/background.js` dan ganti dengan kredensial Supabase Anda:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
const DASHBOARD_URL = "https://your-dashboard-url.com";
```

### Permissions

Extension memerlukan permissions berikut:

**Simply Guard:**
- `management` - Untuk deteksi extension lain
- `declarativeNetRequest` - Untuk blocking URL
- `storage` - Untuk menyimpan state
- `tabs` - Untuk monitoring tab

**Simply Main:**
- `cookies` - Untuk inject cookies
- `storage` - Untuk cache session
- `tabs` - Untuk membuka service
- `activeTab` - Untuk akses tab aktif
- `scripting` - Untuk inject content script

### Host Permissions

Tambahkan domain service Anda di `manifest.json`:

```json
"host_permissions": [
  "https://netflix.com/*",
  "https://*.netflix.com/*",
  "https://your-service-domain.com/*"
]
```

## 🛠️ Development

### Setup Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Dashboard (untuk testing)**
   ```bash
   npm run dev
   ```

3. **Load Extension di Browser**
   - Ikuti langkah instalasi di atas
   - Setiap kali edit code, klik "Reload" di chrome://extensions

### File Structure

```
extensions/
├── guard/
│   ├── manifest.json       # Extension config
│   ├── background.js       # Service worker
│   ├── content.js          # Content script
│   └── rules.json          # Blocking rules
└── main/
    ├── manifest.json       # Extension config
    ├── background.js       # Service worker
    ├── content.js          # Content script
    ├── popup.html          # Popup UI
    ├── popup.css           # Popup styles
    └── popup.js            # Popup logic
```

### Adding New Service

1. **Tambahkan domain di manifest.json**
   ```json
   "host_permissions": [
     "https://new-service.com/*"
   ]
   ```

2. **Tambahkan service di database**
   - Login ke dashboard admin
   - Tambahkan service baru dengan cookies

3. **Reload extension**
   - Klik "Reload" di chrome://extensions
   - Service baru akan muncul di popup

### Debugging

**Background Script:**
```javascript
// Di background.js, console.log akan muncul di:
// chrome://extensions -> Simply Main -> Inspect views: service worker
console.log("Debug message");
```

**Content Script:**
```javascript
// Di content.js, console.log akan muncul di:
// Developer Tools (F12) di tab yang aktif
console.log("Debug message");
```

**Popup:**
```javascript
// Di popup.js, console.log akan muncul di:
// Klik kanan popup -> Inspect
console.log("Debug message");
```

## 🧪 Testing

### Manual Testing

1. **Test Guard Extension**
   - Buka Netflix
   - Coba akses `/account` atau `/billing`
   - Harus otomatis redirect ke `/browse`
   - Install cookie editor extension
   - Harus otomatis disabled dengan notifikasi

2. **Test Main Extension**
   - Klik icon Simply Main di toolbar
   - Harus muncul popup dengan daftar service
   - Klik salah satu service
   - Harus otomatis buka tab baru dan login

3. **Test Cookie Injection**
   - Buka service yang sudah diklik
   - Cek cookies di Developer Tools (F12) -> Application -> Cookies
   - Harus ada cookies yang diinjeksi

4. **Test Session Sync**
   - Logout dari dashboard
   - Klik icon extension
   - Harus muncul "Not logged in"
   - Login kembali
   - Refresh extension
   - Harus muncul daftar service

### Automated Testing

Untuk production, tambahkan automated tests:

```bash
# Install testing framework
npm install --save-dev jest @types/chrome

# Run tests
npm test
```

## 🔒 Security Considerations

### Cookie Security
- Cookies disimpan di chrome.storage.local (encrypted by browser)
- Cookies hanya diinjeksi ke domain yang sesuai
- Session diverifikasi setiap 5 menit

### Extension Security
- Guard extension mencegah cookie theft
- Blocking rules menggunakan declarativeNetRequest (tidak bisa dibypass)
- Extension detection menggunakan chrome.management API

### Best Practices
- Jangan commit Supabase credentials ke git
- Gunakan environment variables untuk production
- Audit cookies secara berkala
- Monitor extension permissions

## 🐛 Troubleshooting

### Extension tidak muncul setelah install
- Pastikan Developer mode aktif
- Cek apakah ada error di chrome://extensions
- Reload extension dengan klik tombol refresh

### Popup menampilkan "Guard extension required"
- Install Simply Guard terlebih dahulu
- Pastikan Guard extension aktif (toggle ON)
- Reload kedua extension

### Popup menampilkan "Not logged in"
- Login ke dashboard Simply
- Refresh extension
- Cek console untuk error message

### Service tidak bisa dibuka
- Cek apakah plan Anda mencukupi
- Cek apakah service memiliki cookies di database
- Cek console untuk error message

### Cookies tidak terinjeksi
- Cek format cookies (JSON atau Netscape)
- Cek domain cookies sesuai dengan service
- Cek permissions di manifest.json

### Extension error setelah update Chrome
- Reload extension di chrome://extensions
- Atau disable/enable kembali extension
- Cek apakah manifest.json compatible dengan Chrome version

## 📝 Notes

### Production Deployment

Untuk production, Anda perlu:

1. **Publish ke Chrome Web Store**
   - Buat developer account ($5 one-time fee)
   - Upload extension sebagai ZIP
   - Submit untuk review (1-3 hari)

2. **Update Download Page**
   - Ganti link download dengan Chrome Web Store URL
   - Atau host ZIP file di server Anda

3. **Auto-update**
   - Extension di Chrome Web Store auto-update
   - Untuk self-hosted, tambahkan update_url di manifest.json

### Icon Files

Extension memerlukan icon files (belum included):
- `icon-16.png` - 16x16px
- `icon-48.png` - 48x48px
- `icon-128.png` - 128x128px

Buat icon dengan logo Simply dan simpan di folder extension.

## 📄 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please read contributing guidelines first.

## 📧 Support

Jika ada pertanyaan atau masalah:
- Buka issue di GitHub
- Atau hubungi support@simply.com
