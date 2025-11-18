// routes/PixelModelRouter.js
// High-level Pixel model endpoints that do not require the client to pass
// raw launch price; instead we look up per-storage MSRP from the registry.

import express from "express";
import { listPixelModels, getPixelModel, resolveLaunchPrice } from "../models/pixelModelRegistry.js";
import { parseNumber, getPredictionSeries, senseCurrentValue } from "../models/pixelPricingModel.js";

const router = express.Router();

// GET /api/pixel-models -> list of available pixel models (key + metadata)
router.get("/pixel-models", (req, res) => {
  try {
    res.json({ models: listPixelModels() });
  } catch (err) {
    console.error("/api/pixel-models error", err);
    res.status(500).json({ error: "Failed to list pixel models" });
  }
});

// GET /api/pixel-predictions?model=pixel_9&storage=128&condition=Excellent&horizon=12&band=0.1
// Backfill automatically inferred from release->today.
router.get("/pixel-predictions", (req, res) => {
  try {
    const { model, storage, condition, horizon: hQ, band: bandQ } = req.query;
    if (!model) {
      return res.status(400).json({ error: "Missing model" });
    }
    const info = getPixelModel(model);
    if (!info) {
      return res.status(404).json({ error: "Unknown pixel model key" });
    }

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) {
      return res.status(400).json({ error: "Invalid or missing storage" });
    }
    const launchPrice = resolveLaunchPrice(model, storageGb);
    if (!Number.isFinite(launchPrice)) {
      return res.status(404).json({ error: "No launch price found for storage" });
    }
    const cond = typeof condition === "string" ? condition : "Excellent";

    const horizon = Math.max(0, parseNumber(hQ, 24));
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) {
      return res.status(400).json({ error: "Invalid release date in registry" });
    }

    // Backfill = full age since release (ceiling) so history covers from release to today.
    const msPerDay = 86400000;
    const today = new Date();
    const days = (today - releaseDate) / msPerDay;
    const ageMonths = Math.max(0, days / 30.44);
    const backfill = Math.ceil(ageMonths);

    const result = getPredictionSeries({
      releaseDate,
      launchPrice,
      storageGb,
      condition: cond,
      horizon,
      backfill,
      band,
    });

    // Augment meta with model key & resolved storage launch price
    result.meta.modelKey = model;
    result.meta.modelName = info.name;
    result.meta.resolvedLaunch = launchPrice;
    res.json(result);
  } catch (err) {
    console.error("/api/pixel-predictions error", err);
    res.status(500).json({ error: "Internal error computing pixel predictions" });
  }
});

// GET /api/pixel-sense?model=pixel_9&storage=128&condition=Good&band=0.1
router.get("/pixel-sense", (req, res) => {
  try {
    const { model, storage, condition, band: bandQ } = req.query;
    if (!model) {
      return res.status(400).json({ error: "Missing model" });
    }
    const info = getPixelModel(model);
    if (!info) {
      return res.status(404).json({ error: "Unknown pixel model key" });
    }
    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) {
      return res.status(400).json({ error: "Invalid or missing storage" });
    }
    const launchPrice = resolveLaunchPrice(model, storageGb);
    if (!Number.isFinite(launchPrice)) {
      return res.status(404).json({ error: "No launch price found for storage" });
    }
    const cond = typeof condition === "string" ? condition : "Excellent";
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));
    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) {
      return res.status(400).json({ error: "Invalid release date in registry" });
    }
    const sense = senseCurrentValue({
      releaseDate,
      launchPrice,
      storageGb,
      condition: cond,
      band,
    });
    sense.meta.modelKey = model;
    sense.meta.modelName = info.name;
    sense.meta.resolvedLaunch = launchPrice;
    res.json(sense);
  } catch (err) {
    console.error("/api/pixel-sense error", err);
    res.status(500).json({ error: "Internal error computing pixel sense value" });
  }
});

export default router;
