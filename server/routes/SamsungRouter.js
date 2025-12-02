// routes/samsungRouter.js
// Unified endpoints for Samsung Galaxy S Base + Plus + Ultra catalog devices.

import express from "express";

import {
  listSamsungModels,
  getSamsungPredictions,
  getSamsungSense,
} from "../controllers/samsungController.js";

const router = express.Router();

// GET /api/samsung-models?tier=base|plus|ultra
router.get("/samsung-models", listSamsungModels);

// GET /api/samsung-predictions?tier=base|plus|ultra&device=galaxy_s23&storage=256&condition=Excellent&horizon=12&band=0.1
router.get("/samsung-predictions", getSamsungPredictions);

// GET /api/samsung-sense?tier=base|plus|ultra&device=galaxy_s23&storage=256&condition=Very%20Good&band=0.1
router.get("/samsung-sense", getSamsungSense);

export default router;
