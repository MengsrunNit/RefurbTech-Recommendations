import express from "express";
import PhoneController from "../controllers/phoneController.js";
import { listModels } from "../models/iphonePricingModel.js";

const router = express.Router();

// Legacy simple prediction endpoint (keeps compatibility)
router.post("/predict-price", PhoneController.predictPrice);

// New: list available iPhone model fits
router.get("/phone-models", (req, res) => {
  try {
    res.json({ models: listModels() });
  } catch (err) {
    console.error("/api/phone-models error", err);
    res.status(500).json({ error: "Internal error listing phone models" });
  }
});
// GET /api/phone-predictions?model=iphone_pro&release=YYYY-MM-DD&storage=128&condition=Excellent&horizon=12&backfill=6&band=0.1
router.get("/phone-predictions", PhoneController.getPhonePredictions);

router.get("/phones", PhoneController.getPhones);

export default router;
