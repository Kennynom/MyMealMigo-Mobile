# MyMealMigo - Nutrition Companion App

A comprehensive nutrition tracking and meal planning application built with React Native and Expo Router.

## 🚀 Recent Updates & Features

### ✨ Latest Changes (Current Version)
- **🔥 Firebase Integration**: Connected to Firestore database for real-time content management
- **🎨 Hero Section**: Dynamic hero component with Firebase-powered images and content
- **📊 Features Section**: Six-feature grid showcasing app capabilities
- **🌐 Web Landing Page**: Full MyMealMigo website experience on web platform
- **📱 Platform Detection**: Smart rendering for web vs mobile experiences
- **🧭 Fixed Routing**: Proper navigation defaulting to home page
- **🎯 WebLayout**: Navigation bar and responsive design for web view

### 🎯 Available Features

#### 📱 **Mobile App Features:**
- BMI Calculator
- Basic home dashboard
- Tab navigation between sections
- Mobile-optimized interface

#### 🌐 **Web Features:**
- **Hero Section**: Dynamic content with Firebase-powered images
- **Features Showcase**: 
  - 📊 Smart Dashboard - Track calories, weight, and progress
  - 📱 Barcode & Image Food Logging - AI-powered meal logging
  - 🍽️ Personalized Meal Recommendations - Tailored diet suggestions
  - 💬 Generative AI Chatbot - Instant nutrition advice
  - 💡 Daily Nutrition Tips - Health habit improvement
  - 📖 Reflection Journal - Mindful eating tracking
- **Responsive Navigation**: MyMealMigo website navbar
- **Firebase Content Management**: Real-time content updates

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo Router
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for images)
- **Styling**: React Native StyleSheet
- **Navigation**: Expo Router with tab-based navigation
- **State Management**: React Context (ThemeContext)
- **Platform**: Web & Mobile (iOS/Android via Expo)

## 📦 Dependencies & Installation

### **Core Dependencies:**
```json
{
  "@expo/vector-icons": "^14.0.4",
  "@react-navigation/native": "^6.0.2",
  "expo": "~51.0.28",
  "expo-constants": "~16.0.2",
  "expo-font": "~12.0.9",
  "expo-linking": "~6.3.1",
  "expo-router": "~3.5.23",
  "expo-splash-screen": "~0.27.5",
  "expo-status-bar": "~1.12.1",
  "expo-system-ui": "~3.0.7",
  "expo-web-browser": "~13.0.3",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-native": "0.74.5",
  "react-native-reanimated": "~3.10.1",
  "react-native-safe-area-context": "4.10.5",
  "react-native-screens": "3.31.1",
  "react-native-web": "~0.19.10"
}
```

### **Firebase Dependencies:**
```json
{
  "firebase": "^10.13.2"
}
```

### **Development Dependencies:**
```json
{
  "@babel/core": "^7.20.0",
  "@types/react": "~18.2.45",
  "@types/react-native": "^0.73.0",
  "typescript": "~5.3.3"
}
```

## 🚀 Getting Started

### **Prerequisites:**
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Git

### **Installation Steps:**

1. **Clone the repository:**
   ```bash
   git clone [your-repo-url]
   cd mobile-mmm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install specific packages used in this project:**
   ```bash
   # Firebase for backend services
   npm install firebase

   # Expo Router for navigation
   npx expo install expo-router

   # Vector icons for UI
   npx expo install @expo/vector-icons

   # Safe area handling
   npx expo install react-native-safe-area-context

   # Screen management
   npx expo install react-native-screens

   # Animations
   npx expo install react-native-reanimated
   npm install react-native-chart-kit
   npx expo install react-native-svg
   
   # Additional dependencies used in this project

   npx expo install @react-native-async-storage/async-storage
   npx expo install @react-native-community/datetimepicker
   npx expo install @react-navigation/bottom-tabs
   npx expo install @react-navigation/elements
   npx expo install @react-navigation/native
   npx expo install expo-haptics
   npx expo install expo-image
   npx expo install expo-linear-gradient
   npx expo install expo-constants
   npx expo install expo-font
   npx expo install expo-linking
   npx expo install expo-splash-screen
   npx expo install expo-status-bar
   npx expo install expo-symbols
   npx expo install expo-system-ui
   npx expo install expo-web-browser
   npx expo install react-native-gesture-handler
   npx expo install react-native-web
   npx expo install react-native-worklets
   ```

4. **Start development server:**
   ```bash
   npx expo start
   ```

5. **View on different platforms:**
   - **Web**: Press `w` or visit `http://localhost:8081`
   - **iOS**: Press `i` or scan QR code with Expo Go app
   - **Android**: Press `a` or scan QR code with Expo Go app

### **Firebase Setup:**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Copy your Firebase config to `config/firebase.js`
5. Set up your database structure as shown in the Firebase Integration section

## 📁 Project Structure

```
mobile-mmm/
├─ app/
│  ├─ _layout.jsx
│  ├─ (tabs)/
│  │  ├─ _layout.jsx
│  │  ├─ (home)/
│  │  │  ├─ _layout.jsx
│  │  │  └─ index.jsx
│  │  ├─ (discover)/
│  │  │  ├─ _layout.jsx
│  │  │  └─ index.jsx
│  │  ├─ (add)/
│  │  │  ├─ _layout.jsx
│  │  │  └─ index.jsx
│  │  ├─ (logs)/
│  │  │  ├─ _layout.jsx
│  │  │  ├─ index.jsx
│  │  │  └─ view-log.jsx
│  │  └─ (tracker)/
│  │     ├─ _layout.jsx
│  │     ├─ index.jsx
│  │     └─ (calorie)/calorie-tracker.jsx
│  └─ other route files...
├─ components/
│  ├─ forms/
│  │  └─ ProfileSetup.tsx         
│  ├─ ui/
│  │  ├─ icon-symbol.tsx
│  │  └─ icon-symbol.ios.tsx
│  ├─ parallax-scroll-view.tsx
│  └─ ...other shared components
├─ context/
│  └─ ThemeContext.js
├─ constants/
│  └─ theme.ts
├─ hooks/
│  ├─ use-theme-color.ts
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  └─ useContent.js
├─ lib/
│  └─ firebase.js
├─ scripts/
│  └─ reset-project.js
├─ package.json
├─ app.json
├─ tsconfig.json
└─ README.md
```

## Updated file directory

Notes
- ProfileSetup.tsx now shows "Other" pills for Allergies, Conditions, Injuries and Diet Plan. The corresponding TextInput fields are rendered only when "Other" is selected and are cleared when deselected.
- PAR-Q question 7 now conditionally reveals its "other" TextInput only when the q7 flag is true.

## 🔥 Firebase Integration

### Database Structure:
```javascript
// Collection: landingPageContent
// Document: main
{
  hero: {
    title1: "Eat Smart,",
    title2: "Live Better.",
    description: "MyMealMigo is your all-in-one nutrition companion...",
    imageURL: "https://firebasestorage.googleapis.com/...",
    mediaType: "image"
  },
  features: [
    {
      title: "Smart Dashboard",
      description: "Track calories, weight, and progress...",
      icon: "BarChart2"
    },
    // ... 5 more features
  ],
  pricing: [...],
  howItWorks: [...]
}
```

## 🎯 What's Working

### ✅ **Fully Functional:**
- Firebase Firestore integration
- Dynamic Hero section with real images
- Features section with 6-card grid
- Web navigation and responsive layout
- Platform-specific rendering
- BMI Calculator (mobile)
- Theme management

### 🚧 **Coming Soon:**
- Pricing section
- Testimonials section  
- How It Works section
- User authentication
- Food logging functionality
- AI chatbot integration
- Barcode scanning
- Meal recommendations

## 🌐 Live Demo

- **Web Version**: Full MyMealMigo landing page with Firebase data
- **Mobile Version**: Native app experience with tab navigation

## 📱 Platform Support

- ✅ **Web Browser**: Full website experience
- ✅ **iOS**: Via Expo Go app
- ✅ **Android**: Via Expo Go app
- 🚧 **Native Builds**: Coming soon

## 🔧 Development Commands

```bash
# Start development server
npx expo start

# Start with cleared cache
npx expo start --clear

# Web only
npx expo start --web

# Check for updates
npx expo install --fix

# Build for production (coming soon)
# npx expo build
```

## 🐛 Troubleshooting

### Common Issues:
- **Firebase connection errors**: Check your `config/firebase.js` configuration
- **Navigation issues**: Ensure all route files exist and are properly structured  
- **Image loading problems**: Verify Firebase Storage permissions and URLs
- **Platform detection**: Clear browser cache if web/mobile detection fails
- **tsconfig.json**: If you have error you can copy paste the following code into `tsconfig.json` file
# to copy
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.jsx",
    "**/*.js",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
---

**MyMealMigo - Making healthy eating simple, personalized, and fun!** 🥗✨