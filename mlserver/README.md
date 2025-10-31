# MyMealMigo ML Server

This is the standalone ML server for food recognition and nutrition data API.

## 🚀 Quick Start

### From the root project directory:
```bash
# Install dependencies (first time only)
npm run mlserver:install

# Start the ML server
npm run mlserver

# Or start with auto-reload (development)
npm run mlserver:dev
```

### From this directory (mlserver):
```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## 📁 Project Structure

```
mlserver/
├── src/
│   ├── server.js           # Main Express server
│   ├── foodsRouter.js      # Foods API endpoints
│   └── routes/
│       └── classify.js        # ML classification endpoint
├── data/
│   └── foods.json         # Nutrition database (single source of truth)
├── model/
│   └── food/
│       ├── model.json     # Teachable Machine model
│       ├── metadata.json  # Model metadata
│       └── weights.bin    # Model weights
└── package.json
```

## 🌐 Endpoints

The server runs on **port 5174** by default.

### Model Files (Static)
- `GET /model/food/model.json` - ML model structure
- `GET /model/food/metadata.json` - Model metadata
- `GET /model/food/weights.bin` - Model weights

### Foods API
- `GET /api/foods` - List all foods  
- `GET /api/foods/:id` - Get food by ID

**Note**: Barcode functionality has been moved to local services in the main app for better separation of concerns.

## 🔧 Configuration

The server listens on **0.0.0.0:5174** to allow connections from:
- ✅ localhost (web browser)
- ✅ iOS devices on same network
- ✅ Android devices on same network
- ✅ Android emulators

## 📱 Connecting from Mobile App

Update the IP address in `lib/ml/engine.js`:

```javascript
const ML_SERVER_URL = 'http://YOUR_LOCAL_IP:5174';
```

To find your local IP:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **macOS/Linux**: `ifconfig` or `ip addr`

## 📝 Notes

- The `data/foods.json` file is the **single source of truth** for nutrition data
- The mobile app's `utils/nutritionService.js` imports directly from this file
- Model files are served statically to the React Native WebView for ML inference
