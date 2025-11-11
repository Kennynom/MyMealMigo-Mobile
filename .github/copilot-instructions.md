<!-- Copilot / AI agent instructions for MyMealMigo-Mobile -->
# Quick guide for code-writing agents

Keep edits small, preserve existing style (React Native + TypeScript/JSX). Prefer minimal, focused changes and include tests or simple smoke checks for any runtime code you add.

## Big picture
- **Platform**: React Native + Expo Router (v6) app targeting web and mobile (iOS/Android). Uses React 19 and new architecture enabled (`app.json`).
- **Backend**: Firebase (Firestore + Storage + Auth). Platform-safe config in `config/firebase.js`; env-driven config in `lib/firebase.js` via `EXPO_PUBLIC_*` vars.
- **Routing**: File-based under `app/` using Expo Router typed routes (`experiments.typedRoutes: true`). Navigate via `router.push()` from `expo-router`.
- **Global state**: React Contexts in `context/`:
  - `AuthContext.tsx`: user, roles (`admin`, `nutritionist`, `premium`, `free`, `guest`), permissions. Access via `useAuth()`.
  - `ThemeContext.js`: light/dark theme switching.
  - `JournalContext.tsx`: reflection journal state.
  - `ContentProvider.tsx`: landing page content from Firestore (`landingPage` collection).
- **ML Server**: Separate Node.js server (`mlserver/`) for food recognition (TensorFlow.js + Teachable Machine). Run via `npm run mlserver`. Connects to `EXPO_PUBLIC_ML_SERVER_URL` (set in `.env`).

## Developer workflows & commands
```bash
# Start main app (mobile/web)
npm run start              # expo start (choose platform)
npm run android            # expo run:android
npm run ios                # expo run:ios  
npm run web                # expo start --web

# ML server (food recognition API)
npm run mlserver:install   # first-time setup
npm run mlserver           # start server (port 5174)
npm run mlserver:dev       # dev mode with auto-reload

# Code quality
npm run lint               # eslint via expo lint config
npx expo start --clear     # clear cache for runtime checks

# Utilities
node ./scripts/reset-project.js  # project reset helper
node ./utils/createAdminUser.js  # create admin/nutritionist accounts
```

## Project-specific patterns and conventions
### Routing
- File-based routes in `app/` with nested group directories: `app/(tabs)/(tracker)/(calorie)/calorie-tracker.jsx`.
- Navigate: `router.push('/(tabs)/(home)')` or `router.replace()`. Routes auto-inferred from filenames.
- Root redirect: `app/index.jsx` redirects to `/(auth)/login` by default.

### Platform detection
- Use `Platform.OS` (React Native) for branching logic (e.g., `Platform.OS === 'web'`).
- Firebase Analytics only initializes on web (`config/firebase.js`).
- KeyboardAvoidingView: `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` pattern in forms.
- Platform-specific files: `component.ios.tsx` vs `component.tsx` for native-only code.

### Auth and roles
- `AuthContext.tsx` real-time listener on `users/{uid}` doc. Derives roles from `role` field:
  - `admin`, `nutritionist`: `canAccessWeb: true` (web dashboard access).
  - `free`, `premium`: `canAccessMobile: true` (mobile app features).
  - `guest`: unauthenticated.
- `PlatformGuard.tsx`: conditionally renders based on platform + role. Web shows landing for all; mobile requires auth.
- Role changes in Firestore instantly update context via `onSnapshot`.

### Firestore data structure
Critical paths (breaking these affects consumers):
```
users/{uid}
  ├─ email, name, role, accountStatus, createdAt
  └─ private/
      └─ health_profile/
          ├─ allergies, conditions, fitness, parqPlus, etc.
          ├─ calorie_logs/main → { dailyLogs[], weeklyLogs[], monthlyLogs[] }
          ├─ meal_logs/main → { dailyLogs[] }
          ├─ weight_log/main → { logs[] }
          └─ reflection_log/main → { entries[] }
```
- User creation: `components/auth/SignUpForm.tsx` seeds `users/{uid}` + `health_profile` + empty log collections. Uses `serverTimestamp()` for timestamps.
- Meal logging: `utils/mealService.js` → `logMealToFirebase()` updates `meal_logs/main.dailyLogs` via `arrayUnion`.
- Always use `serverTimestamp()` from `config/firebase.js` for Firestore writes, not `new Date()`.

### Styling
- Inline `StyleSheet.create()` (React Native). Pass `theme` from `ThemeContext` to `createStyles(theme)` helper pattern.
- Use `@/` path alias for imports (tsconfig: `"@/*": ["./*"]`).

### ML food recognition
- `lib/ml/engine.js`: WebView-based TensorFlow.js engine. Loads model from ML server (`EXPO_PUBLIC_ML_SERVER_URL/model/food/model.json`).
- Usage: `await classifyUri(photoUri)` returns `{ className, probability }`. Check `probability >= CONFIDENCE_THRESHOLD` (0.70).
- Camera: `components/camera/CameraScreen.jsx` uses `expo-camera`. Requires permissions via `useCameraPermissions()`.
- Nutrition data: `utils/nutritionService.js` fetches from ML server (`/api/foods` endpoints).

## Integration points to watch
### Firebase
- **Config**: `config/firebase.js` (hardcoded, dev use) vs `lib/firebase.js` (env vars for prod). Use `db` and `storage` exports from `config/firebase.js` in app code.
- **Env vars**: `.env` file with `EXPO_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_ML_SERVER_URL`. Expo loads these automatically.

### ML Server
- Express server in `mlserver/src/server.js`. Serves model at `/model`, product images at `/images`, food API at `/api/foods`.
- Listens on `0.0.0.0:5174` for network access (iOS device testing). Update `.env` with local IP for physical device testing.

### Context providers
- Wrap app in order (see `app/_layout.jsx`): `AuthProvider` → `ThemeProvider` → `JournalProvider` → `SafeAreaProvider` → `PlatformGuard` → `NavigationThemeProvider`.

### Route groups
- Groups use `(groupName)` syntax. Don't rename without checking imports and route references.
- Tabs: `app/(tabs)/_layout.jsx` defines bottom tab navigation with icons and routes.

## Examples to follow
### User creation with seeded data
`components/auth/SignUpForm.tsx`:
1. `createUserWithEmailAndPassword(auth, email, password)`
2. Write `users/{uid}` doc with basic fields.
3. `seedHealthProfile(uid)` → write `private/health_profile`.
4. `initializeCalorieLogs(uid)` → create empty log collections (`calorie_logs/main`, `meal_logs/main`, etc.).
5. On Firestore error, rollback auth user via `deleteUser()`.

### Role derivation
`context/AuthContext.tsx`:
- `onAuthStateChanged` → `onSnapshot(doc(db, "users", uid))` for real-time updates.
- Map `data.role` string to `UserRole` type → derive `isAdmin`, `isNutritionist`, `canAccessWeb`, `canAccessMobile`.

### Platform-specific keyboard handling
`app/(tabs)/(add)/manual-entry.jsx`:
```jsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
>
```

### Camera + ML flow
`components/camera/CameraScreen.jsx`:
1. Request permissions: `useCameraPermissions()`.
2. Capture photo: `cameraRef.current.takePictureAsync()`.
3. Classify: `const prediction = await classifyUri(photo.uri)`.
4. Fetch nutrition: `await getFoodNutrition(foodId)` from ML server.
5. Navigate to results: `FoodRecognitionResults` component.

## Safety & quick checks for PRs
- **Lint**: `npm run lint` (catches style/syntax issues).
- **Cache clear**: `npx expo start --clear` (resolves stale module errors).
- **Firestore paths**: Never rename document paths (`users/{uid}/private/health_profile`, `calorie_logs/main`, `meal_logs/main`). Update all consumers if necessary.
- **serverTimestamp**: Use `serverTimestamp()` from `config/firebase.js`, not `Timestamp.now()` or `new Date()`, for consistency across clients.
- **Role changes**: Update both Firestore `users/{uid}.role` AND `AuthContext.tsx` logic.
- **ML server**: Ensure `.env` has `EXPO_PUBLIC_ML_SERVER_URL` set and `npm run mlserver` is running for food recognition features.

## Common gotchas
- **Expo Router navigation**: Use `router.push()` from `expo-router`, not `navigation.navigate()` from React Navigation.
- **TypeScript paths**: `@/` alias works but requires `tsconfig.json` paths config. Don't use relative imports (`../../../`).
- **Platform OS checks**: Use `Platform.OS`, not `Platform.select()`, for simple conditionals.
- **Firebase imports**: Import `db`, `storage`, `serverTimestamp` from `config/firebase.js`, not `lib/firebase.js` (lib is for env-driven setup only).
- **WebView ML engine**: `MlEngine` component must be mounted once at app root (already in `app/_layout.jsx`). Don't add multiple instances.

If anything is unclear or you need more examples (env setup, test accounts, specific components), ask and I'll expand this doc.
