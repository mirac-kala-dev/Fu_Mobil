# Fırat Üniversitesi Teknik Bilimler MYO Mobil Uygulaması

## 📌 Proje Hakkında

Bu proje, Fırat Üniversitesi Teknik Bilimler Meslek Yüksekokulu öğrencilerinin okul ile ilgili duyuru, haber, akademik birim ve iletişim bilgilerine mobil cihazları üzerinden kolayca erişebilmesi amacıyla geliştirilmiştir.

Üniversite bitirme projesi kapsamında hazırlanan uygulama, React Native tabanlı mobil arayüz ve Node.js tabanlı backend mimarisinden oluşmaktadır.

## 🎯 Projenin Amacı

Öğrencilerin okul hakkındaki güncel bilgilere tek bir mobil uygulama üzerinden ulaşmasını sağlamak ve okul ile öğrenciler arasındaki bilgi erişimini kolaylaştırmak.

## 🚀 Uygulama Özellikleri

- Okul haberlerini görüntüleme
- Haberler arasında arama yapma
- Haber detaylarına erişme
- Duyuru özetlerini görüntüleme
- Akademik birimleri ve bölüm bilgilerini inceleme
- Hızlı erişim bağlantıları
- Okul hakkında bilgilendirme alanı
- İletişim bilgileri ve okul konumu
- Alt sekmeli mobil navigasyon
- OBS kullanıcı girişi ve rol tabanlı yetkilendirme altyapısı
- Yönetici giriş ekranı
- Yönetici panelinden haber, duyuru, hızlı erişim ve iletişim içeriklerini güncelleme

## 🛠️ Kullanılan Teknolojiler

### Mobil Uygulama (Frontend)

- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage
- Expo Vector Icons

### Sunucu Tarafı (Backend)

- Node.js
- Express.js
- MySQL
- mysql2
- dotenv
- bcryptjs
- JSON Web Token (JWT)
- CORS

## 🏗️ Proje Mimarisi

Proje iki ana bölümden oluşmaktadır:

**Frontend:** React Native ve Expo kullanılarak geliştirilen mobil uygulama. Kullanıcı arayüzü, ekranlar, navigasyon ve API iletişimini yönetir.

**Backend:** Node.js ve Express.js ile geliştirilen sunucu tarafı. API isteklerini karşılar, MySQL veritabanı işlemlerini yürütür ve yönetici işlemlerini gerçekleştirir.

## 📂 Proje Yapısı

```text
Fu_Mobil/
│
├── backend/
│   ├── .env.example
│   ├── db.js
│   ├── package.json
│   ├── server.js
│   └── setup.sql
│
└── frontend/
    ├── .env.example
    ├── App.js
    ├── app.json
    ├── index.js
    ├── package.json
    │
    └── src/
        ├── components/
        ├── config/
        ├── constants/
        ├── context/
        ├── navigation/
        └── screens/
```

## 💻 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js
- npm
- MySQL Server
- Expo Go veya Android emülatörü

### 1. Projeyi Klonlama

```bash
git clone https://github.com/mirac-kala-dev/Fu_Mobil.git
cd Fu_Mobil
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

`.env.example` dosyasını `.env` olarak kopyalayın ve veritabanı bağlantı bilgilerinizi düzenleyin.

Örnek yapılandırma:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fukampus_db
ADMIN_PASSWORD=guclu_bir_yonetici_sifresi
FORCE_SYNC_FROM_WEB=0
```

Backend sunucusunu başlatın:

```bash
npm start
```

### 3. Frontend Kurulumu

Yeni bir terminal açarak frontend klasörüne geçin:

```bash
cd frontend
npm install
```

`.env.example` dosyasını `.env` olarak kopyalayın.

API adresini yapılandırın:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

Buradaki IP adresini kendi bilgisayarınızın yerel ağ IP adresiyle değiştirin.

Expo geliştirme ortamını başlatın:

```bash
npm start
```

Telefon ve bilgisayarın aynı Wi-Fi ağına bağlı olması gerekir.

## 🔐 Yönetici Paneli

Mobil uygulama içerisinde bulunan Admin sekmesi üzerinden yönetici girişi yapılabilir.

Yönetici paneli aracılığıyla:

- Haber içerikleri
- Hızlı erişim bağlantıları
- Duyuru özetleri
- İletişim bilgileri

görüntülenebilir ve güncellenebilir.

### Yönetici API Uç Noktaları

| HTTP Metodu | API Uç Noktası | Açıklama |
|---|---|---|
| POST | `/api/admin/login` | Yönetici girişi |
| GET | `/api/admin/bootstrap` | Mevcut içerikleri alma |
| PUT | `/api/admin/news` | Haberleri güncelleme |
| PUT | `/api/admin/quick-links` | Hızlı erişimleri güncelleme |
| PUT | `/api/admin/announcements` | Duyuruları güncelleme |
| PUT | `/api/admin/contact` | İletişim bilgilerini güncelleme |

## 🔒 Güvenlik Notları

- Gerçek kullanım öncesinde yönetici parolasını değiştirin.
- `.env` dosyasını GitHub üzerinde paylaşmayın.
- Veritabanı bağlantı bilgilerini kendi ortamınıza göre yapılandırın.
- Gerçek kullanıcı verileriyle kullanmadan önce kimlik doğrulama ve yetkilendirme süreçlerini test edin.

## 👨‍💻 Geliştirici

**Miraç Kala**

GitHub: [mirac-kala-dev](https://github.com/mirac-kala-dev)

---

Bu proje, mobil uygulama geliştirme, REST API tasarımı, veritabanı yönetimi ve frontend-backend entegrasyonu alanlarında gerçekleştirdiğim üniversite bitirme çalışmasıdır.
