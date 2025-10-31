// server/src/server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import foodsRouter from "./foodsRouter.js";
import barcodesRouter from "./routes/barcodesRouter.js";


dotenv.config();

const app = express();
app.use(express.json());

// allow everything during dev; tighten later if you want
app.use(cors());

// --- ESM-safe __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Teachable Machine model folder at /model
// Folder on disk: server/model/food/{model.json, metadata.json, weights.bin, ...}
app.use("/model", express.static(path.join(__dirname, "../model")));

// Serve product images at /images
// This will serve images from the main project's assets/products/ folder
app.use("/images", express.static(path.join(__dirname, "../../assets/products")));

// Foods API (list, match, get by id)
app.use("/api/foods", foodsRouter);
app.use("/api/barcodes", barcodesRouter);

// Health check
app.get("/", (_req, res) => {
  res.send("ML server is up");
});

const PORT = process.env.PORT || 5174;
// Listen on all interfaces (0.0.0.0) so iOS device can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ML server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: Check your local IP and use http://[YOUR-IP]:${PORT}`);
});
