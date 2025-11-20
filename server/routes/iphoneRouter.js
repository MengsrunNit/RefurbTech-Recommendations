// routes/iphoneRouter.js
// Unified endpoints for iPhone Base + Pro + Pro Max catalog devices.

import express from "express";
import {
  listIphoneModels,
  getIphonePredictions,
  getIphoneSense,
} from "../controllers/iphoneController.js";

const router = express.Router();

// GET /api/iphone-models?tier=base|pro|pro_max
router.get("/iphone-models", listIphoneModels);

// GET /api/iphone-predictions?tier=base|pro|pro_max&device=iphone_14&storage=128&condition=Excellent&horizon=12&band=0.1
router.get("/iphone-predictions", getIphonePredictions);

// GET /api/iphone-sense?tier=base|pro|pro_max&device=iphone_14&storage=128&condition=Very%20Good&band=0.1
router.get("/iphone-sense", getIphoneSense);

export default router;
