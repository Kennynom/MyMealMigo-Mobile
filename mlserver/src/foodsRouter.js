import fs from "fs";
import path from "path";
import { Router } from "express";

const router = Router();
const foodsPath = path.join(process.cwd(), "data", "foods.json");
const foods = JSON.parse(fs.readFileSync(foodsPath, "utf8"));

// List all foods (optional)
router.get("/", (_req, res) => {
  res.json(foods);
});

// Get by id
router.get("/:id", (req, res) => {
  const id = String(req.params.id || "");
  const item = foods.find(f => f.id === id);
  if (!item) return res.status(404).json({ error: "Food not found" });
  res.json(item);
});

export default router;
