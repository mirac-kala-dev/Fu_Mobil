# TB MYO Mobil Proje - Son Hali

Bu repoda eksik kalan kritik maddeler tamamlandi:

1. Backend MySQL ayari `.env` uzerinden yonetiliyor.
2. Frontend API adresi `.env` ile gercek cihazdan kolayca degistiriliyor.
3. Mobil uygulama icine admin panel eklendi (giris + toplu icerik kaydetme).

## 1) Backend .env ayari

`backend/.env.example` dosyasini `backend/.env` olarak kopyalayin:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ADMIN_PASSWORD`
- `FORCE_SYNC_FROM_WEB` (1 olursa sunucu acilisinda resmi sabit veri tekrar yazilir)

Ornek:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=fukampus_db
ADMIN_PASSWORD=admin123
FORCE_SYNC_FROM_WEB=0
```

Calistirma:

```bash
cd backend
npm install
npm start
```

## 2) Frontend API adresi (gercek telefon)

`frontend/.env.example` dosyasini `frontend/.env` olarak kopyalayin ve bilgisayarinizin LAN IP'sini girin:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.105:3000
```

Not:
- Telefon ve bilgisayar ayni Wi-Fi aginda olmali.
- Bu degisken varsa `frontend/src/config/api.js` otomatik olarak bunu kullanir.

Calistirma:

```bash
cd frontend
npm install
npm start
```

## 3) Admin panel kullanimi

- Uygulamada alt menude `Admin` sekmesine gir.
- `ADMIN_PASSWORD` ile giris yap.
- `Giris yap ve verileri cek` ile tum icerigi JSON olarak al.
- JSON alanlarini duzenle.
- `Tumunu kaydet` ile ayni anda:
  - Haberler
  - Hizli erisim
  - Duyuru ozetleri
  - Iletisim
    verisini guncelle.

Admin API uclari:
- `POST /api/admin/login`
- `GET /api/admin/bootstrap`
- `PUT /api/admin/news`
- `PUT /api/admin/quick-links`
- `PUT /api/admin/announcements`
- `PUT /api/admin/contact`

## Kalan son kontroller

- Android gercek cihazda uctan uca test
- Teslim paketi (kurulum videosu, APK/Expo linki, test checklist)
