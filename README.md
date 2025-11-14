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

#### 📱 **For All Users (Free):**
- ✅ Account Management (Login, Signup, Profile Setup)
- ✅ Basic Dashboard with calorie overview
- ✅ Manual meal logging
- ✅ View calorie logs (daily/weekly/monthly)
- ✅ Food dictionary and recipe browsing
- ✅ Health calculators (BMI, BMR, Calorie Goal)
- ✅ Activity tracking
- ✅ Educational tips
- ✅ Reflection journal
- ✅ Dark/Light theme support

#### 💎 **Premium Features:**
- ✅ Smart Dashboard with predictive insights
- ✅ Barcode scanning for quick meal logging
- ✅ Photo capture with AI food recognition
- ✅ Weight progress tracker with history
- ✅ AI Chatbot for nutrition advice
- ✅ Advanced analytics and charts
- ✅ Quick summary view (well-being aggregation)

#### 🌐 **Web-Specific Features:**
- ✅ Full MyMealMigo landing page
- ✅ Hero section with dynamic content
- ✅ Features showcase
- ✅ Responsive navigation
- ✅ Pricing and subscription info

## 🛠️ Tech Stack

- **Frontend Framework**: React Native 0.81.4, React 19.1.0
- **Navigation**: Expo Router v6, React Navigation v7
- **Backend & Database**: 
  - Firebase Firestore (NoSQL database)
  - Firebase Storage (image hosting)
  - Firebase Authentication
- **State Management**: 
  - React Context API
  - AsyncStorage for local persistence
- **UI & Styling**: 
  - React Native StyleSheet
  - Expo Linear Gradient
  - Expo Blur
  - Victory Native (charts)
  - React Native Chart Kit
  - React Native SVG
- **Platform Support**: 
  - Expo ~54.0.11
  - iOS & Android (via Expo Go)
  - Web (React Native Web)
- **AI & ML**:
  - Custom ML Server (TensorFlow.js) for food recognition
  - Botpress Chatbot integration
- **Media & Camera**:
  - Expo Camera
  - Expo Image Picker
  - React Native Webview
- **Utilities**:
  - Day.js (date handling)
  - Dotenv (environment variables)
  - Expo Haptics (tactile feedback)
  - React Native Gesture Handler
  - React Native Reanimated (animations)
- **Development Tools**:
  - TypeScript ~5.9.2
  - ESLint with Expo config
  - VS Code

## 📦 Dependencies & Installation

### **All Dependencies (from package.json):**
```json
{
  "@expo/vector-icons": "^15.0.2",
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-native-community/datetimepicker": "8.4.4",
  "@react-navigation/bottom-tabs": "^7.4.9",
  "@react-navigation/elements": "^2.6.5",
  "@react-navigation/native": "^7.1.18",
  "dayjs": "^1.11.19",
  "dotenv": "^17.2.3",
  "expo": "~54.0.11",
  "expo-blur": "~15.0.7",
  "expo-camera": "~17.0.8",
  "expo-constants": "~18.0.9",
  "expo-font": "~14.0.9",
  "expo-haptics": "~15.0.7",
  "expo-image": "~3.0.10",
  "expo-image-picker": "~17.0.8",
  "expo-linear-gradient": "~15.0.7",
  "expo-linking": "~8.0.8",
  "expo-router": "~6.0.13",
  "expo-splash-screen": "~31.0.10",
  "expo-status-bar": "~3.0.8",
  "expo-symbols": "~1.0.7",
  "expo-system-ui": "~6.0.7",
  "expo-web-browser": "~15.0.9",
  "firebase": "^12.4.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.4",
  "react-native-chart-kit": "^6.12.0",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "15.12.1",
  "react-native-web": "^0.21.0",
  "react-native-webview": "13.15.0",
  "react-native-worklets": "^0.5.1",
  "victory-native": "^41.20.1"
}
```

### **Development Dependencies:**
```json
{
  "@types/react": "~19.1.0",
  "eslint": "^9.25.0",
  "eslint-config-expo": "~10.0.0",
  "typescript": "~5.9.2"
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

3. **Install all dependencies (Complete Command):**
   ```bash
   # Install all packages at once
   npm install
   
   # Or install individually if needed:
   npm install firebase dayjs dotenv
   
   npx expo install expo-router expo-constants expo-font expo-linking
   npx expo install expo-splash-screen expo-status-bar expo-system-ui
   npx expo install expo-web-browser expo-symbols
   npx expo install @expo/vector-icons
   npx expo install @react-native-async-storage/async-storage
   npx expo install @react-native-community/datetimepicker
   npx expo install @react-navigation/bottom-tabs
   npx expo install @react-navigation/elements
   npx expo install @react-navigation/native
   npx expo install expo-blur expo-camera expo-haptics
   npx expo install expo-image expo-image-picker expo-linear-gradient
   npx expo install react-native-chart-kit react-native-svg
   npx expo install react-native-gesture-handler
   npx expo install react-native-reanimated
   npx expo install react-native-safe-area-context
   npx expo install react-native-screens
   npx expo install react-native-web react-native-webview
   npx expo install react-native-worklets
   npx expo install victory-native
   ```

4. **Set up ML Server (for food image recognition):**
   ```bash
   # Install ML server dependencies
   npm run mlserver-install
   
   # Start ML server (run in separate terminal)
   npm run mlserver
   ```

4. **Start development server:**
   ```bash
   npx expo start
   ```

5. **View on different platforms:**
   - **Web**: Press `w` or visit `http://localhost:8081`
   - **iOS**: Press `i` or scan QR code with Expo Go app
   - **Android**: Press `a` or scan QR code with Expo Go app

### **Environment Setup:**
The `.env` file is included in the repository for easy setup. It contains:
- Firebase configuration (API keys, project ID, etc.)
- Botpress chatbot URL and ID
- ML Server URL for food image recognition

**Note**: For production deployment, you should create your own Firebase project and update the `.env` file accordingly.

## 📁 Project Structure

```
MyMealMigo-Mobile/
├── .env                              # Environment variables (Firebase, APIs)
├── .expo/                            # Expo build files
├── .github/                          # GitHub workflows
├── .gitignore                        # Git ignore rules
├── .vscode/                          # VS Code settings
├── android/                          # Android native code
├── app/                              # Main application routes
│   ├── _layout.jsx                   # Root layout
│   ├── index.jsx                     # Landing/home entry
│   ├── +not-found.jsx               # 404 page
│   ├── (auth)/                       # Authentication routes
│   │   ├── landing.jsx               # Landing page
│   │   ├── login.jsx                 # Login screen
│   │   ├── signup.jsx                # Sign up screen
│   │   └── profile-setup.jsx         # Initial profile setup
│   ├── (journal)/                    # Reflection journal
│   │   ├── _layout.jsx
│   │   └── Editor.jsx                # Journal entry editor
│   ├── (tabs)/                       # Main tab navigation
│   │   ├── _layout.jsx
│   │   ├── (home)/                   # Home/Dashboard tab
│   │   │   ├── _layout.jsx
│   │   │   ├── index.jsx             # Dashboard
│   │   │   ├── (profile)/            # User profile section
│   │   │   │   ├── index.jsx
│   │   │   │   ├── (personal)/       # Personal information
│   │   │   │   ├── (health)/         # Health information
│   │   │   │   └── (subscription)/   # Subscription management
│   │   │   └── (tips)/               # Educational tips
│   │   │       └── index.jsx
│   │   ├── (discover)/               # Discover tab
│   │   │   ├── _layout.jsx
│   │   │   ├── index.jsx             # Food dictionary
│   │   │   └── (recipe)/             # Recipe browsing
│   │   ├── (add)/                    # Add meal tab
│   │   │   ├── _layout.jsx
│   │   │   ├── index.jsx             # Meal entry options
│   │   │   ├── (barcode)/            # Barcode scanner
│   │   │   ├── (camera)/             # Photo capture
│   │   │   └── (manual)/             # Manual entry
│   │   ├── (logs)/                   # Logs tab
│   │   │   ├── _layout.jsx
│   │   │   ├── index.jsx             # Meal logs list
│   │   │   └── view-log.jsx          # Detailed log view
│   │   └── (tracker)/                # Tracker tab
│   │       ├── _layout.jsx
│   │       ├── index.jsx             # Tracker dashboard
│   │       ├── (calorie)/            # Calorie tracking
│   │       │   └── calorie-tracker.jsx
│   │       ├── (activity)/           # Activity tracking
│   │       │   └── index.jsx
│   │       ├── (health-calculator)/  # Health calculators
│   │       │   └── index.jsx         # BMI, BMR, Calorie Goal
│   │       └── (progress)/           # Weight progress
│   │           └── index.jsx
│   └── chat/                         # AI Chatbot
│       └── index.jsx
├── assets/                           # Static assets
│   ├── data/
│   │   └── content_manifest.json     # Content metadata
│   ├── images/                       # App images/icons
│   └── products/                     # Food product images
├── components/                       # Reusable components
│   ├── auth/                         # Auth-related components
│   ├── bot-chat.tsx                  # Chatbot component
│   ├── calculators/                  # Calculator components
│   ├── camera/                       # Camera components
│   ├── chat-button.tsx               # Floating chat button
│   ├── dashboard/                    # Dashboard widgets
│   ├── download.jsx                  # Download section
│   ├── external-link.tsx             # External links
│   ├── features.jsx                  # Features showcase
│   ├── footer.jsx                    # Footer component
│   ├── forms/                        # Form components
│   │   └── ProfileSetup.tsx          # Profile setup form
│   ├── haptic-tab.tsx                # Tab with haptic feedback
│   ├── hello-wave.tsx                # Animated wave
│   ├── hero.jsx                      # Hero section
│   ├── how-it-works.jsx              # How it works section
│   ├── layouts/                      # Layout components
│   ├── parallax-scroll-view.tsx      # Parallax scrolling
│   ├── pricing.jsx                   # Pricing section
│   ├── ReflectionRow.jsx             # Reflection entry row
│   ├── SummaryModal.jsx              # Well-being summary
│   ├── testimonials.jsx              # Testimonials section
│   ├── themed-text.tsx               # Themed text component
│   ├── themed-view.tsx               # Themed view component
│   ├── tips/                         # Tips components
│   ├── ui/                           # UI primitives
│   │   ├── icon-symbol.tsx           # Icon symbols
│   │   └── icon-symbol.ios.tsx       # iOS-specific icons
│   └── UpgradeModal.jsx              # Premium upgrade modal
├── config/
│   └── firebase.js                   # Firebase configuration
├── constants/
│   └── theme.ts                      # Theme constants
├── context/                          # React Context providers
│   ├── AuthContext.tsx               # Authentication state
│   ├── ContentProvider.tsx           # Content management
│   ├── JournalContext.tsx            # Journal state
│   └── ThemeContext.js               # Theme state
├── hooks/                            # Custom React hooks
│   ├── use-color-scheme.ts           # Color scheme hook
│   ├── use-color-scheme.web.ts       # Web-specific color scheme
│   ├── use-theme-color.ts            # Theme color hook
│   ├── useContent.js                 # Content hook
│   ├── useDailyContent.js            # Daily content hook
│   └── usePremiumStatus.js           # Premium status hook
├── lib/
│   ├── firebase.js                   # Firebase utilities
│   ├── dnt/                          # Do Not Track utilities
│   └── ml/                           # Machine learning utilities
├── mlserver/                         # ML Server for food recognition
│   ├── package.json
│   ├── README.md
│   ├── data/                         # Training data
│   ├── model/                        # Trained models
│   └── src/                          # Server source code
├── scripts/
│   └── reset-project.js              # Project reset script
├── types/
│   ├── health.ts                     # Health-related types
│   └── landingPage.ts                # Landing page types
├── utils/                            # Utility functions
│   ├── firebase.ts                   # Firebase helpers
│   ├── iconMap.ts                    # Icon mapping
│   ├── mealService.js                # Meal CRUD operations
│   ├── nutritionService.js           # Nutrition data service
│   ├── platform.js                   # Platform detection
│   └── utils.ts                      # General utilities
├── app.json                          # Expo configuration
├── eslint.config.js                  # ESLint configuration
├── expo-env.d.ts                     # Expo type declarations
├── firebase.json                     # Firebase configuration
├── package.json                      # Dependencies
├── README.md                         # This file
└── tsconfig.json                     # TypeScript configuration
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
- **Authentication System**: Login, Signup, Profile Setup, Account Management
- **Firebase Integration**: Firestore database, real-time listeners, Firebase Storage
- **User Dashboard**: 
  - Smart dashboard with calorie tracking
  - Activity ring and goal progress
  - Recent meals display
  - Reflection stats
  - Predictive insights for goal tracking
- **Calorie & Meal Tracking**:
  - Daily/weekly/monthly calorie logs
  - Meal logging (breakfast, lunch, dinner, snacks)
  - Manual meal entry
  - Barcode scanning (Premium)
  - Photo capture meal logging (Premium)
  - Meal editing and deletion
  - Calorie goal tracking
- **Food Dictionary & Recipes**: Browse foods and recipes with nutritional info
- **Health Calculators**:
  - BMI Calculator
  - BMR Calculator  
  - Calorie Goal Calculator (Deficit/Surplus)
  - Auto-population from user profile
  - Save to profile functionality
- **Weight Tracking** (Premium):
  - Current weight display
  - Target weight setting
  - Weight history log
  - Progress graph visualization
- **Activity Tracker**:
  - Daily activity logging
  - Activity history
  - Goal ring visualization
  - CRUD operations for activities
- **Reflection Journal**:
  - Mood tracking
  - Sleep hours logging
  - Hydration tracking
  - Stress and energy levels
  - Quick summary view with aggregated metrics
  - CRUD operations for reflections
- **Educational Tips**:
  - Daily nutrition tips
  - Save favorite tips
  - View saved tips history
- **AI Chatbot** (Premium):
  - Botpress integration
  - Nutrition Q&A
  - Health advice
- **Premium Features**:
  - Subscription management
  - Upgrade/downgrade account
  - Premium-only features gating
- **ML Food Recognition**:
  - Image classification via ML server
  - Camera integration
  - Automatic nutrition data lookup
- **Theme Management**: Light/dark mode support
- **Responsive Design**: Web and mobile optimized layouts

### 🚧 **Known Limitations:**
- ML Server requires local setup for food image recognition
- Camera features require physical device (not available in web browser)
- Barcode scanning requires camera permissions

## 🌐 Live Demo

- **Web Version**: Full MyMealMigo landing page with Firebase data
- **Mobile Version**: Native app experience with tab navigation

## 📱 Platform Support

- ✅ **Web Browser**: Full website experience with responsive design
- ✅ **iOS**: Native app via Expo Go or standalone build
- ✅ **Android**: Native app via Expo Go or standalone build
- ⚠️ **Camera Features**: Requires physical device (not available in simulators/web)

## 📚 Project Information

**MyMealMigo** is a comprehensive nutrition companion mobile application developed as a Final Year Project (FYP). The app combines modern mobile development practices with AI/ML technologies to provide users with an intuitive and personalized nutrition tracking experience.

### **Key Highlights:**
- Full-stack mobile application with Firebase backend
- Premium subscription model with feature gating
- AI-powered food recognition using custom ML server
- Integrated chatbot for nutrition advice
- Real-time data synchronization
- Cross-platform support (iOS, Android, Web)

### **Academic Deliverables:**
- Complete mobile application codebase
- Firebase integration and database design
- Machine learning server for food classification
- User authentication and authorization
- Premium subscription system
- Comprehensive documentation

### **For Evaluators:**
The `.env` file is included in the repository for easy evaluation and testing. Simply clone the repository, run `npm install`, and start the development server with `npx expo start`. All features are ready to test out of the box.

---

**MyMealMigo - Making healthy eating simple, personalized, and fun!** 🥗✨

## 👥 Contributors

- **Development Team**: MyMealMigo Team
- **Institution**: [Your University Name]
- **Project Type**: Final Year Project (FYP)
- **Year**: 2024-2025

```bash
# Start development server
npx expo start

# Start with cleared cache
npx expo start --clear

# Web only
npx expo start --web

# Android only
npx expo start --android

# iOS only  
npx expo start --ios

# Run ML Server (food image recognition)
npm run mlserver

# Install ML Server dependencies
npm run mlserver-install

# Check for updates
npx expo install --fix

# Lint code
npm run lint

# Reset project (clean start)
npm run reset-project
```

## 🤖 ML Server (Food Image Recognition)

The project includes a machine learning server for food image recognition located in the `mlserver/` directory.

### **Setup:**
```bash
# Install ML server dependencies
cd mlserver
npm install

# Or use the npm script from root
npm run mlserver-install
```

### **Running:**
```bash
# Start ML server (default port: 5174)
npm run mlserver

# The server will be available at:
# http://localhost:5174
```

### **Features:**
- Food image classification using TensorFlow.js
- Pre-trained model for Malaysian and international foods
- REST API for image prediction
- Integration with React Native camera

### **Configuration:**
Update the ML server URL in `.env`:
```env
EXPO_PUBLIC_ML_SERVER_URL=http://192.168.18.81:5174
```
**Note**: Change the IP address to your local machine's IP address for mobile testing.

## 🐛 Troubleshooting

### Common Issues:

#### **Firebase Connection Errors:**
- Check your `.env` file exists and contains all required Firebase variables
- Verify Firebase project is active at [console.firebase.google.com](https://console.firebase.google.com)
- Ensure Firestore database and Firebase Storage are enabled
- Check network connectivity

#### **ML Server Issues:**
- Ensure ML server is running: `npm run mlserver`
- Update `EXPO_PUBLIC_ML_SERVER_URL` in `.env` with your local IP address
- For mobile testing, use your computer's IP address (not localhost)
- Check firewall settings allow connections on port 5174

#### **Camera/Photo Features Not Working:**
- Camera requires physical device (not available in web browser or iOS Simulator)
- Grant camera permissions when prompted
- For Android, check `android/app/src/main/AndroidManifest.xml` includes camera permissions

#### **Navigation Issues:**
- Clear Expo cache: `npx expo start --clear`
- Ensure all route files exist and are properly structured
- Check for typos in route paths

#### **Image Loading Problems:**
- Verify Firebase Storage permissions
- Check image URLs are accessible
- Ensure images are uploaded to Firebase Storage

#### **Platform Detection Issues:**
- Clear browser cache if web/mobile detection fails
- Check `utils/platform.js` for platform detection logic

#### **TypeScript Errors:**
If you encounter TypeScript configuration errors, update `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
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
```

#### **Environment Variables Not Loading:**
- Restart development server after changing `.env`
- Ensure variable names start with `EXPO_PUBLIC_`
- Check `.env` file is in root directory
- Verify no syntax errors in `.env` file

#### **Dependencies Issues:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use npm cache clean
npm cache clean --force
npm install
```
---

**MyMealMigo - Making healthy eating simple, personalized, and fun!** 🥗✨