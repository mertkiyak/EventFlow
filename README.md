# 🎉 EventFlow - Etkinlik Keşif ve Sosyalleşme Uygulaması

<div align="center">

![EventFlow Logo](https://via.placeholder.com/200x200?text=EventFlow)

**Etkinlikleri keşfedin, katılın ve yeni insanlarla tanışın!**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📖 Proje Hakkında

**EventFlow**, çevrenizde düzenlenen etkinlikleri keşfetmenizi, kendi etkinliklerinizi oluşturmanızı ve yeni insanlarla tanışmanızı sağlayan modern bir mobil uygulamadır. İster konser, ister yemek davetleri, ister spor aktiviteleri - EventFlow ile her türlü sosyal etkinliği tek bir platformda bulabilirsiniz!

### ✨ Temel Özellikler

- 🔍 **Etkinlik Keşfi**: İlgi alanlarınıza göre özelleştirilmiş etkinlik önerileri
- 📅 **Kişisel Etkinlik Oluşturma**: Kendi etkinliklerinizi kolayca oluşturun ve paylaşın
- 📸 **Görsel Paylaşım**: Etkinliklerinize çekici görseller ekleyin
- 🗓️ **Yaklaşan Etkinlikler**: Gelecek etkinliklerinizi takip edin
- 👥 **Sosyal Etkileşim**: Diğer kullanıcıların etkinliklerine katılın
- 🔔 **Bildirimler**: Etkinlik hatırlatmaları ve güncellemeler
- 🌙 **Karanlık Tema**: Göz dostu modern arayüz
- 📱 **Cross-Platform**: iOS ve Android desteği

---

## 🚀 Teknoloji Stack

### Frontend
- **React Native** - Mobil uygulama geliştirme
- **Expo** - React Native geliştirme platformu
- **TypeScript** - Tip güvenli JavaScript
- **React Native Paper** - Material Design bileşenleri
- **Expo Router** - Navigasyon yönetimi

### Backend
- **Appwrite** - Backend as a Service (BaaS)
  - Kimlik doğrulama
  - Veritabanı
  - Dosya depolama
  - Gerçek zamanlı güncellemeler

### Diğer Kütüphaneler
- **expo-image-picker** - Resim seçme ve yükleme
- **react-native-gesture-handler** - Gesture desteği
- **@react-native-community/datetimepicker** - Tarih/saat seçimi

---

## 📋 Gereksinimler

- **Node.js** >= 18.x
- **npm** veya **yarn**
- **Expo CLI**
- **Appwrite** hesabı ([appwrite.io](https://appwrite.io))
- **iOS Simulator** (macOS) veya **Android Emulator**

---

## ⚙️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/mertkiyak/eventflow.git
cd eventflow
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 3. Appwrite Yapılandırması

#### 3.1. Appwrite Projesi Oluşturun
1. [Appwrite Console](https://cloud.appwrite.io)'a gidin
2. Yeni bir proje oluşturun
3. Project ID'yi kopyalayın

#### 3.2. Database Oluşturun
1. **Database** bölümüne gidin
2. Yeni bir database oluşturun
3. Database ID'yi kopyalayın

#### 3.3. Collections Oluşturun

**Events Collection:**
```
Collection ID: events
Attributes:
- title (string, required)
- description (string, required)
- location (string, required)
- event_date (datetime, required)
- image_url (string, optional)
- user_id (string, required)
- created_at (datetime, required)

Permissions:
- Create: role:member
- Read: role:all
- Update: role:member
- Delete: role:member
```

#### 3.4. Storage Bucket Oluşturun
1. **Storage** bölümüne gidin
2. Yeni bucket oluşturun (Bucket ID: event-images)
3. Permissions ayarları:
   - Read: `role:all`
   - Create: `role:member`
   - Delete: `role:member`
4. Allowed Extensions: `jpg, jpeg, png, gif, webp`
5. Max File Size: `10MB`

### 4. Ortam Değişkenlerini Ayarlayın

`lib/appwrite.ts` dosyasını oluşturun/güncelleyin:

```typescript
import { Client, Account, Databases, Storage } from "react-native-appwrite";

export const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
export const PROJECT_ID = "YOUR_PROJECT_ID";
export const DATABASE_ID = "YOUR_DATABASE_ID";
export const COLLECTION_ID = "YOUR_COLLECTION_ID";
export const BUCKET_ID = "event-images";

const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client };
```

### 5. Uygulamayı Başlatın

```bash
npx expo start
```

Ardından:
- `i` tuşuna basarak iOS Simulator'da açın
- `a` tuşuna basarak Android Emulator'da açın
- Expo Go uygulamasıyla QR kodu taratın

---

## 📱 Kullanım

### Kayıt Olma ve Giriş Yapma
1. Uygulamayı açın
2. E-posta ve şifre ile kayıt olun
3. Hesabınıza giriş yapın

### Etkinlik Oluşturma
1. Ana sayfada **"+"** butonuna tıklayın
2. Etkinlik bilgilerini doldurun:
   - Etkinlik adı
   - Tarih ve saat
   - Konum
   - Açıklama
   - Görsel (opsiyonel)
3. **"Etkinliği Kaydet"** butonuna tıklayın

### Etkinliklere Katılma
1. Ana sayfada etkinlikleri inceleyin
2. İlginizi çeken etkinliğe tıklayın
3. **"Katıl"** butonuna basın

### Etkinlikleri Keşfetme
- **Benim Eklediğim Etkinlikler**: Oluşturduğunuz etkinlikler
- **İlgi Alanlarıma Göre Etkinlikler**: Size özel öneriler
- **Yaklaşan Etkinlikler**: Gelecek etkinlikleriniz

---

## 🗂️ Proje Yapısı

```
eventflow/
├── app/
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── index.tsx           # Ana sayfa
│   │   ├── add-event.tsx       # Etkinlik ekleme
│   │   ├── explore.tsx         # Keşfet
│   │   └── profile.tsx         # Profil
│   └── _layout.tsx
├── lib/
│   ├── appwrite.ts             # Appwrite yapılandırması
│   └── auth-context.tsx        # Kimlik doğrulama context
├── types/
│   └── database.type.ts        # TypeScript tipleri
├── components/                 # Yeniden kullanılabilir bileşenler
├── assets/                     # Görseller ve dosyalar
├── app.json
├── package.json
└── README.md
```

---

## 🎨 Ekran Görüntüleri

<div align="center">
  <img src="https://via.placeholder.com/250x500?text=Ana+Sayfa" alt="Ana Sayfa" width="250"/>
  <img src="https://via.placeholder.com/250x500?text=Etkinlik+Ekle" alt="Etkinlik Ekle" width="250"/>
  <img src="https://via.placeholder.com/250x500?text=Profil" alt="Profil" width="250"/>
</div>

---

## 🔐 Güvenlik

- Tüm kullanıcı verileri Appwrite güvenlik katmanı ile korunur
- Kimlik doğrulama token'ları güvenli şekilde saklanır
- HTTPS üzerinden veri iletimi
- Rol tabanlı erişim kontrolü (RBAC)

---

## 🐛 Bilinen Sorunlar

- [ ] iOS'ta bazı resimler yavaş yüklenebilir
- [ ] Çok fazla etkinlik olduğunda performans optimizasyonu gerekebilir

---

## 🚧 Geliştirme Aşamasında

- [ ] Etkinlik yorumlama sistemi
- [ ] Kullanıcı takip sistemi
- [ ] Mesajlaşma özelliği
- [ ] Harita entegrasyonu
- [ ] Kategori filtreleme
- [ ] Arama fonksiyonu
- [ ] Favorilere ekleme
- [ ] Push notification desteği

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Katkıda bulunmak için:

1. Bu repo'yu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

## 👨‍💻 Geliştirici

**[Adınız]**

- GitHub: [@mertkiyak](https://github.com/mertkiyak)
- LinkedIn: [linkedin.com/in/kullaniciadi](https://linkedin.com/in/mert-kiyak)
- E-posta: mertkiyak09@gmail.com

---

## 📞 İletişim

Sorularınız veya önerileriniz için:
- Issue açın: [GitHub Issues](https://github.com/mertkiyak/eventflow/issues)
- E-posta gönderin: mertkiyak09@gmail.com

---

<div align="center">

**EventFlow ile etkinliklerinizi keşfedin! 🎉**

⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!

</div>