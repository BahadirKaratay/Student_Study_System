# LGS Student Tracking System

## 📱 About the Application

This application is developed for students preparing for LGS (High School Entrance Exam) in Turkey. Students can track their mock exam performances, calculate net scores, and monitor their progress.

## 🚀 Running the Application

### Requirements
- Node.js (v14 or higher)
- Expo CLI
- Android/iOS device or Expo Go app

### Running in Development Mode

1. **Navigate to project folder:**
```bash
cd Ogrenci-Takip
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npx expo start
```

4. **Test on phone with QR code:**
   - Download Expo Go app
   - Scan the QR code from terminal with Expo Go

## 📱 Using Expo Go

### What is Expo Go?
Expo Go is the official Expo app used to test React Native applications. It can be downloaded for free from App Store or Play Store.

### Step-by-Step Usage:

1. **Download Expo Go:**
   - **Android:** [Expo Go from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS:** [Expo Go from App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Open the app:**
   - Open Expo Go app on your phone
   - Tap "Scan QR Code" button

3. **Scan QR code:**
   - When developer runs `npx expo start`, a QR code appears in terminal
   - Scan this QR code with Expo Go
   - The app will automatically load and open

### ⚠️ Important Notes:
- If QR code redirects to website, development server is not running
- You don't need to be on the same WiFi network (with tunnel mode)
- App updates automatically when changes are made

## 🌐 Web Version

The application also works in web browsers:
- **Live Link:** [https://gilded-medovik-cccedc.netlify.app/](https://gilded-medovik-cccedc.netlify.app/)
- Web version has mobile responsive design

## 🔧 Build and Deploy

### Production Build (APK)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Android APK build
eas build --platform android --profile preview
```

### Web Build
```bash
# Build for web
npx expo build:web

# Deploy to Netlify
# Drag and drop build folder to Netlify
```

### EAS Update (OTA Updates)
```bash
# Update configuration
eas update:configure

# Update to production branch
eas update --branch production
```

## 📋 Application Features

- **Net Score Calculation:** Calculate net scores from correct/incorrect answers
- **Subject-Based Tracking:** Turkish, Mathematics, Science, Social Studies, English
- **Statistics:** Performance charts and analysis
- **Exam History:** Records of previous exams
- **Responsive Design:** Compatible with both mobile and web

## 🛠️ Technologies

- **Frontend:** React Native / Expo
- **Styling:** React Native StyleSheet / Tailwind (web)
- **Navigation:** React Navigation
- **State Management:** React Hooks
- **Build Tool:** EAS Build
- **Deployment:** Netlify (web), EAS (mobile)

## 📱 Supported Platforms

- **iOS:** iPhone and iPad
- **Android:** Android 6.0+
- **Web:** Modern browsers (Chrome, Firefox, Safari, Edge)

## 👨‍🏫 For Instructors

If you want to test this application:

1. **Easiest Method:** Download Expo Go and scan QR code
2. **Alternative:** Open web version in browser
3. **If APK needed:** Developer can send you APK file

## 🐛 Troubleshooting

### If app opens and crashes:
- Run in development mode and check console logs
- See errors in terminal with `npx expo start`

### If QR code redirects to website:
- Make sure development server is running
- Try `npx expo start --tunnel` command

### Build errors:
- Reinstall dependencies with `npm install`
- Check Node.js version

## 📄 License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).

© 2025 Bahadır Karatay

## 📞 Contact

Please contact for any issues or suggestions.

---

**Note:** This project is developed for educational purposes.
