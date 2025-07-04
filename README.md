# LGS Öğrenci Takip Sistemi

## 📱 Uygulama Hakkında

Bu uygulama, LGS (Liselere Geçiş Sınavı) hazırlığı yapan öğrenciler için geliştirilmiş bir takip sistemidir. Öğrenciler deneme sınavlarındaki performanslarını takip edebilir, net hesaplamaları yapabilir ve gelişimlerini gözlemleyebilirler.

## 🚀 Uygulamayı Çalıştırma

### Gereksinimler
- Node.js (v14 veya üzeri)
- Expo CLI
- Android/iOS cihaz veya Expo Go uygulaması

### Development Modunda Çalıştırma

1. **Proje klasörüne gidin:**
```bash
cd Ogrenci-Takip
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Development server'ı başlatın:**
```bash
npx expo start
```

4. **QR kod ile telefonda test edin:**
   - Expo Go uygulamasını indirin
   - Terminal'da çıkan QR kodu Expo Go ile tarayın

## 📱 Expo Go ile Kullanım

### Expo Go Nedir?
Expo Go, React Native uygulamalarını test etmek için kullanılan resmi Expo uygulamasıdır. App Store veya Play Store'dan ücretsiz indirilebilir.

### Adım Adım Kullanım:

1. **Expo Go'yu indirin:**
   - **Android:** [Play Store'dan Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS:** [App Store'dan Expo Go](https://apps.apple.com/app/expo-go/id982107779)

2. **Uygulamayı açın:**
   - Expo Go uygulamasını telefonda açın
   - "Scan QR Code" butonuna basın

3. **QR kodu tarayın:**
   - Geliştirici `npx expo start` komutunu çalıştırdığında terminal'da QR kod çıkar
   - Bu QR kodu Expo Go ile tarayın
   - Uygulama otomatik olarak yüklenip açılacak

### ⚠️ Önemli Notlar:
- QR kodu taradığınızda web sitesine yönlendiriliyorsa, development server çalışmıyor demektir
- Aynı WiFi ağında olmanız gerekmez (tunnel mode ile)
- Uygulama güncellendiğinde otomatik olarak yenilenir

## 🌐 Web Versiyonu

Uygulama aynı zamanda web tarayıcısında da çalışır:
- **Canlı Link:** [https://gilded-medovik-cccedc.netlify.app/](https://gilded-medovik-cccedc.netlify.app/)
- Web versiyonu mobil responsive tasarıma sahiptir

## 🔧 Build ve Deploy

### Production Build (APK)
```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Login
eas login

# Android APK build
eas build --platform android --profile preview
```

### Web Build
```bash
# Web için build
npx expo build:web

# Netlify'e deploy
# Build klasörünü Netlify'e sürükle-bırak
```

### EAS Update (OTA Updates)
```bash
# Update konfigürasyonu
eas update:configure

# Production branch'e update
eas update --branch production
```

## 📋 Uygulama Özellikleri

- **Net Hesaplama:** Doğru/yanlış cevap sayılarından net hesaplama
- **Ders Bazlı Takip:** Türkçe, Matematik, Fen, Sosyal, İngilizce
- **İstatistikler:** Performans grafikleri ve analizi
- **Sınav Geçmişi:** Önceki sınavların kayıtları
- **Responsive Tasarım:** Hem mobil hem web uyumlu

## 🛠️ Teknolojiler

- **Frontend:** React Native / Expo
- **Styling:** React Native StyleSheet / Tailwind (web)
- **Navigation:** React Navigation
- **State Management:** React Hooks
- **Build Tool:** EAS Build
- **Deployment:** Netlify (web), EAS (mobile)

## 📱 Desteklenen Platformlar

- **iOS:** iPhone ve iPad
- **Android:** Android 6.0+
- **Web:** Modern tarayıcılar (Chrome, Firefox, Safari, Edge)

## 👨‍🏫 Eğitmenler İçin

Eğer bu uygulamayı test etmek istiyorsanız:

1. **En Kolay Yöntem:** Expo Go indirip QR kod tarayın
2. **Alternatif:** Web versiyonunu tarayıcıda açın
3. **APK İstenirse:** Geliştirici size APK dosyası gönderebilir

## 🐛 Sorun Giderme

### Uygulama açılıp kapanıyorsa:
- Development modda çalıştırıp console loglarını kontrol edin
- `npx expo start` ile terminal'da hataları görün

### QR kod web sitesine yönlendiriyorsa:
- Development server'ın çalıştığından emin olun
- `npx expo start --tunnel` komutunu deneyin

### Build hataları:
- `npm install` ile bağımlılıkları yeniden yükleyin
- Node.js versiyonunu kontrol edin

## 📞 İletişim

Herhangi bir sorun veya öneri için lütfen iletişime geçin.

---

📄 License
This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License.
© 2025 Bahadır Karatay
