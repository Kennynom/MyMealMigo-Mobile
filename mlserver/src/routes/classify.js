// src/routes/classify.js
import express from "express";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-wasm";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import * as Jimp from 'jimp';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Point TFJS to the wasm files (in node_modules)
setWasmPaths("node_modules/@tensorflow/tfjs-backend-wasm/dist/");

let model = null;
let classLabels = [];

// Load model once (lazy)
async function loadModel() {
  if (model) return;

  await tf.setBackend("wasm");
  await tf.ready();

  const modelPath = path.join(__dirname, "../../model/food/model.json");
  const metaPath  = path.join(__dirname, "../../model/food/metadata.json");

  model = await tf.loadGraphModel(`file://${modelPath}`);
  // read metadata.json to get class labels
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  classLabels = meta.labels || meta.classes || [];
}

// Helper: run prediction on a Jimp image
async function predictJimpImage(img) {
  // Resize to the model's expected size (often 224x224 in Teachable Machine)
  const SIZE = 224;
  img = img.clone().resize(SIZE, SIZE);

  // Convert to tensor [1, h, w, 3], normalized 0..1
  const data = new Uint8Array(img.bitmap.data);
  // Jimp RGBA, drop alpha every 4th byte
  const rgb = [];
  for (let i = 0; i < data.length; i += 4) {
    rgb.push(data[i], data[i+1], data[i+2]);
  }
  const x = tf.tensor3d(rgb, [SIZE, SIZE, 3]).expandDims(0).div(255);

  const logits = model.execute(x);
  const probs = await logits.array();
  x.dispose();
  if (logits.dispose) logits.dispose();

  const arr = probs[0];
  // Find top class
  let maxP = -1, maxIdx = -1;
  arr.forEach((p, i) => {
    if (p > maxP) { maxP = p; maxIdx = i; }
  });

  const label = classLabels[maxIdx] || "Other";
  return { label, prob: maxP };
}

// POST /api/classify  { imageBase64: "data:image/jpeg;base64,...." }
router.post("/", async (req, res) => {
  try {
    await loadModel();

    const { imageBase64 } = req.body || {};
    if (!imageBase64 || !imageBase64.includes("base64,")) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }
    const base64 = imageBase64.split("base64,")[1];
    const buffer = Buffer.from(base64, "base64");

    const img = await Jimp.read(buffer);
    const { label, prob } = await predictJimpImage(img);

    // Map label to our food id (lowercase + underscores)
    const id = label.toLowerCase().replace(/\s+/g, "_");

    // Look up macros
    const foods = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/foods.json"), "utf8"));
    const match = foods.find(f => f.id === id) || null;

    return res.json({ label, prob, id: match?.id || "other", macros: match });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Classification failed" });
  }
});

export default router;
