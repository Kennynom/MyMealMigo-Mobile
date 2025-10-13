Webchat wrapper
================

This small server fetches a Botpress webchat config JSON server-side and serves a wrapper HTML page that initializes the webchat with the config inline. This avoids cross-origin/access-denied errors when using the CDN shareable webchat.

How to run
----------


1. Install dependencies (if you haven't already):

   npm install

2. Start the wrapper (automatic config detection):

   # If you have EXPO_PUBLIC_BOTPRESS_URL set in your project's .env, the server will try to extract
   # the configUrl query param from it automatically. Otherwise set BOTPRESS_CONFIG_URL.
   npm run start:server

   Or explicitly:
   BOTPRESS_CONFIG_URL="https://files.bpcontent.cloud/.../your-config.json" npm run start:server

3. Expose to the internet (so your phone can reach it) using ngrok:

   ngrok http 3000

   Then open the wrapper URL (e.g. https://<ngrok-id>.ngrok.io/webchat-wrapper)

4. In your app `.env`, set:

   EXPO_PUBLIC_BOTPRESS_URL=https://<ngrok-id>.ngrok.io/webchat-wrapper
   EXPO_PUBLIC_BOT_ID=your-bot-id

Restart Metro/Expo and test in Expo Go.

Notes
-----
- This example fetches the config JSON server-side and injects it into the page, which avoids the CDN-to-files cross-origin denial.
- Keep any Botpress API keys or private credentials on the server (not in the mobile app).
- For production, secure the wrapper endpoint (authentication, rate-limiting, caching) and host it on your own domain over HTTPS.
