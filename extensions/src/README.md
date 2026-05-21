# Extensions Source (Backup)

Folder ini berisi **source code asli** (readable) dari kedua extension Simply.

## Struktur

```
src/
├── main/          ← Source Simply Main (readable)
│   ├── background.js
│   ├── content.js
│   ├── crypto.js
│   ├── popup.js
│   ├── popup.html
│   ├── popup.css
│   └── manifest.json
└── guard/         ← Source Simply Guard (readable)
    ├── background.js
    ├── content.js
    ├── crypto.js
    ├── manifest.json
    └── rules.json
```

## Cara Update Extension

Jika ingin mengubah kode extension:

1. Edit file di folder `src/main/` atau `src/guard/`
2. Jalankan script obfuscate:
   ```bash
   npm run obfuscate
   ```
3. File hasil obfuscate otomatis masuk ke `extensions/main/` dan `extensions/guard/`
4. Commit dan push

## Catatan

- Folder `extensions/main/` dan `extensions/guard/` berisi versi **obfuscated** (untuk distribusi)
- Folder `extensions/src/` berisi versi **readable** (untuk development)
- Jangan edit langsung file di `extensions/main/` atau `extensions/guard/` karena sudah di-obfuscate
