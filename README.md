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
├── app/
│   ├── _layout.jsx              # Root layout with providers
│   ├── index.jsx                # Root redirect to home
│   └── (tabs)/
│       ├── _layout.jsx          # Tab navigation controller
│       ├── (home)/
│       │   └── index.jsx        # Main page with Firebase integration
│       ├── (add)/               # Add meal functionality
│       ├── (tracker)/           # BMI calculator & tracking
│       └── (profile)/           # User profile
├── components/
│   ├── hero.jsx                 # Hero section component
│   ├── features.jsx             # Features grid component
│   └── layouts/
│       └── WebLayout.jsx        # Web navigation wrapper
├── config/
│   └── firebase.js              # Firebase configuration
└── context/
    └── ThemeContext.js          # Theme management
```

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

---

**MyMealMigo - Making healthy eating simple, personalized, and fun!** 🥗✨