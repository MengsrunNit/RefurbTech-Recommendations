// routes/pixelRoutes.js
import express from "express";
import {
  STORAGE,
  CONDITION,
  parseNumber,
  getPredictionSeries,
  senseCurrentValue,
} from "../models/pixelPricingModel.js";

const router = express.Router();

router.get("/predictions", (req, res) => {
  try {
    const {
      release,
      launch,
      storage,
      condition,
      horizon: horizonQ,
      backfill: backfillQ,
      band: bandQ,
    } = req.query;

    if (!release) {
      return res
        .status(400)
        .json({ error: "Missing required query param: release (YYYY-MM-DD)" });
    }

    const relDate = new Date(release);
    if (isNaN(relDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid release date format. Use YYYY-MM-DD" });
    }

    const launchPrice = parseNumber(launch, NaN);
    if (!Number.isFinite(launchPrice) || launchPrice <= 0) {
      return res
        .status(400)
        .json({ error: "Missing or invalid launch price (launch)" });
    }

    const storageGb = parseInt(storage, 10);
    if (!Object.prototype.hasOwnProperty.call(STORAGE, storageGb)) {
      return res
        .status(400)
        .json({ error: "Invalid storage. Allowed: 128|256|512" });
    }

    const cond = typeof condition === "string" ? condition : "Excellent";
    if (!Object.prototype.hasOwnProperty.call(CONDITION, cond)) {
      return res
        .status(400)
        .json({ error: "Invalid condition. Use Good|Very Good|Excellent" });
    }

    const horizon = parseNumber(horizonQ, 24);
    const backfill = parseNumber(backfillQ, 6);
    const band = parseNumber(bandQ, 0.1);

    const result = getPredictionSeries({
      releaseDate: relDate,
      launchPrice,
      storageGb,
      condition: cond,
      horizon,
      backfill,
      band,
    });

    res.json(result);
  } catch (err) {
    console.error("/api/predictions error", err);
    res.status(500).json({ error: "Internal error computing predictions" });
  }
});

// Lightweight endpoint: just "sense" current value today (no series)
// GET /api/sense?release=YYYY-MM-DD&launch=799&storage=128&condition=Excellent
router.get("/sense", (req, res) => {
  try {
    const { release, launch, storage, condition, band: bandQ } = req.query;

    if (!release) {
      return res.status(400).json({ error: "Missing release" });
    }

    const relDate = new Date(release);
    if (isNaN(relDate.getTime())) {
      return res.status(400).json({ error: "Invalid release format" });
    }

    const launchPrice = parseNumber(launch, NaN);
    if (!Number.isFinite(launchPrice) || launchPrice <= 0) {
      return res.status(400).json({ error: "Invalid launch price" });
    }

    const storageGb = parseInt(storage, 10);
    if (!Object.prototype.hasOwnProperty.call(STORAGE, storageGb)) {
      return res
        .status(400)
        .json({ error: "Invalid storage (128|256|512)" });
    }

    const cond = typeof condition === "string" ? condition : "Excellent";
    if (!Object.prototype.hasOwnProperty.call(CONDITION, cond)) {
      return res.status(400).json({ error: "Invalid condition" });
    }

    const band = parseNumber(bandQ, 0.1);

    const result = senseCurrentValue({
      releaseDate: relDate,
      launchPrice,
      storageGb,
      condition: cond,
      band,
    });

    res.json(result);
  } catch (err) {
    console.error("/api/sense error", err);
    res.status(500).json({ error: "Internal error computing sensed value" });
  }
});

export default router;
