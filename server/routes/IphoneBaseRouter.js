// routes/IphoneBaseRouter.js
// Endpoints for iPhone base catalog devices (12-17) using the shared 'iphone_base' regression fit.

import express from "express";
import { listIphoneBaseDevices, getIphoneBaseDevice, resolveIphoneBaseLaunch } from "../models/iphoneBaseCatalog.js";
import { getPredictionSeries, parseNumber } from "../models/iphonePricingModel.js";

const router = express.Router();

// GET /api/iphone-base-models
router.get("/iphone-base-models", (req, res) => {
  try {
    res.json({ devices: listIphoneBaseDevices() });
  } catch (err) {
    console.error("/api/iphone-base-models error", err);
    res.status(500).json({ error: "Failed to list iPhone base devices" });
  }
});

// GET /api/iphone-base-predictions?device=iphone_14&storage=128&condition=Excellent&horizon=12&band=0.1
router.get("/iphone-base-predictions", (req, res) => {
  try {
    const { device, storage, condition, horizon: hQ, band: bandQ } = req.query;
    if (!device) return res.status(400).json({ error: "Missing device" });
    const info = getIphoneBaseDevice(device);
    if (!info) return res.status(404).json({ error: "Unknown iPhone base device" });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) return res.status(400).json({ error: "Invalid or missing storage" });

    const cond = typeof condition === "string" ? condition : "Excellent";
    const horizon = Math.max(0, parseNumber(hQ, 24));
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) return res.status(400).json({ error: "Invalid release date in catalog" });

    // Backfill = full history from release to today
    const msPerDay = 86400000;
    const today = new Date();
    const days = (today - releaseDate) / msPerDay;
    const ageMonths = Math.max(0, days / 30.44);
    const backfill = Math.ceil(ageMonths);

    const modelKey = info.fitModelKey || "iphone_base";
    const launchPrice = resolveIphoneBaseLaunch(device, storageGb);
    const result = getPredictionSeries({
      modelKey,
      releaseDate,
      storageGb,
      condition: cond,
      horizon,
      backfill,
      band,
      launchPrice,
    });
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;
    res.json(result);
  } catch (err) {
    console.error("/api/iphone-base-predictions error", err);
    res.status(500).json({ error: "Internal error computing iPhone base predictions" });
  }
});

// GET /api/iphone-base-sense?device=iphone_14&storage=128&condition=Very%20Good&band=0.1
router.get("/iphone-base-sense", (req, res) => {
  try {
    const { device, storage, condition, band: bandQ } = req.query;
    if (!device) return res.status(400).json({ error: "Missing device" });
    const info = getIphoneBaseDevice(device);
    if (!info) return res.status(404).json({ error: "Unknown iPhone base device" });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) return res.status(400).json({ error: "Invalid or missing storage" });
    const cond = typeof condition === "string" ? condition : "Excellent";
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) return res.status(400).json({ error: "Invalid release date in catalog" });

    // For sense we want just today; horizon/backfill=0 yields single point series semantics.
    const modelKey = info.fitModelKey || "iphone_base";
    const launchPrice = resolveIphoneBaseLaunch(device, storageGb);
    const result = getPredictionSeries({
      modelKey,
      releaseDate,
      storageGb,
      condition: cond,
      horizon: 0,
      backfill: 0,
      band,
      launchPrice,
    });
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;
    res.json(result);
  } catch (err) {
    console.error("/api/iphone-base-sense error", err);
    res.status(500).json({ error: "Internal error computing iPhone base sense value" });
  }
});

export default router;
