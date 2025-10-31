// mlserver/src/routes/barcodesRouter.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load barcodes data
let barcodesData = [];
try {
  const barcodesPath = path.join(__dirname, '../../data/barcodes.json');
  const rawData = fs.readFileSync(barcodesPath, 'utf8');
  barcodesData = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading barcodes data:', error);
}

/**
 * GET /api/barcodes/:barcode
 * Look up a product by barcode
 */
router.get('/:barcode', (req, res) => {
  const { barcode } = req.params;
  
  // Find product by barcode
  const product = barcodesData.find(p => p.code === barcode);
  
  if (!product) {
    return res.status(404).json({ 
      error: 'Product not found',
      barcode: barcode 
    });
  }
  
  res.json(product);
});

/**
 * GET /api/barcodes
 * Get all barcodes (for testing)
 */
router.get('/', (req, res) => {
  res.json({
    total: barcodesData.length,
    products: barcodesData
  });
});

export default router;