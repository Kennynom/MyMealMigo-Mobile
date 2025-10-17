<!-- Copilot / AI agent instructions for MyMealMigo-Mobile -->
# Quick guide for code-writing agents

Keep edits small, preserve existing style (React Native + TypeScript/JSX). Prefer minimal, focused changes and include tests or simple smoke checks for any runtime code you add.

## Big picture
- This is a React Native + Expo Router app that targets web and mobile (see `app.json` and `package.json`).
- Firebase (Firestore + Storage + Auth) is the backend; platform-safe config lives in `config/firebase.js` and runtime secrets are referenced in `lib/firebase.js` via `process.env`.
- Route-based UI lives under `app/` using Expo Router typed routes. Shared components are in `components/` and `components/forms`.
- Global state: small React Contexts in `context/` (notably `AuthContext.tsx` and `ThemeContext.js`). Use `useAuth()` to access user role and permissions.

## Developer workflows & commands
- Start dev server: `npm run start` (runs `expo start`). Use `--android`, `--ios`, or `--web` flags as needed (see `package.json` scripts).
- Lint: `npm run lint` (uses Expo lint config).
- Project reset helper: `node ./scripts/reset-project.js`.
- Firebase setup: copy project credentials into `config/firebase.js` (the file already contains an example config). For CI/local envs prefer setting `EXPO_PUBLIC_*` environment vars used by `lib/firebase.js`.

## Project-specific patterns and conventions
- Routing: file-based routes live in `app/` with nested directories representing grouped routes (e.g., `app/(tabs)/(tracker)/(calorie)/calorie-tracker.jsx`).
- Platform detection: many components branch on platform (see `config/firebase.js` where analytics only initializes on web). Prefer platform-safe imports.
- Auth and roles: `AuthContext.tsx` maps Firestore `users/{uid}` document fields to derived roles (`admin`, `nutritionist`, `premium`, `free`, `guest`). Modifying auth behavior should update `AuthContext` logic accordingly.
- Firestore layout: user data is stored under `users/{uid}` and private profile under `users/{uid}/private/health_profile`. When creating users, seed data functions in `components/auth/SignUpForm.tsx` write these documents — preserve field names and `serverTimestamp()` usage.
- Styling: inline StyleSheet objects (React Native) are used across components. Match existing naming and spacing.

## Integration points to watch
- Firebase client: `config/firebase.js` (app-wide) and `lib/firebase.js` (env-driven). When adding new Firebase usages, prefer `db` and `storage` exports from `config/firebase.js`.
- Expo Router typed routes: avoid renaming route files without updating imports — routes are inferred from filenames.
- Native-only code: `icon-symbol.ios.tsx` vs `icon-symbol.tsx` show platform-specific implementations; add `.ios`/`.android` variants when necessary.

## Examples to follow
- Creating a user + seeded profile: see `components/auth/SignUpForm.tsx` — it calls `createUserWithEmailAndPassword`, writes `users/{uid}` and `users/{uid}/private/health_profile`, then rolls back the auth user on Firestore failure. Keep this transactional pattern when adding related flows.
- Role derivation: see `context/AuthContext.tsx` — read Firestore user doc and derive `canAccessWeb`, `isAdmin`, `isNutritionist`. Tests or changes to role names should be reflected here.

## Safety & quick checks for PRs
- Run `npm run lint` and `npx expo start --clear` smoke checks for runtime errors.
- When touching Firebase writes, preserve existing document paths and keys (`private/health_profile`, `calorie_logs/main`). Breaking these will affect data consumers.

If anything here is unclear or you need extra examples (tests, CI commands, or environment values), ask and I will expand the doc.
