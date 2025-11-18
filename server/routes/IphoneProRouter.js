// routes/IphoneProRouter.js
// Endpoints for iPhone Pro catalog devices (12 Pro - 17 Pro) using the 'iphone_pro' regression fit.

import express from "express";
import { listIphoneProDevices, getIphoneProDevice, resolveIphoneProLaunch } from "../models/iphoneProCatalog.js";
import { getPredictionSeries, parseNumber } from "../models/iphonePricingModel.js";

const router = express.Router();

// GET /api/iphone-pro-models
router.get("/iphone-pro-models", (req, res) => {
  try {
    res.json({ devices: listIphoneProDevices() });
  } catch (err) {
    console.error("/api/iphone-pro-models error", err);
    res.status(500).json({ error: "Failed to list iPhone Pro devices" });
  }
});

// GET /api/iphone-pro-predictions?device=iphone_14_pro&storage=256&condition=Excellent&horizon=12&band=0.1
router.get("/iphone-pro-predictions", (req, res) => {
  try {
    const { device, storage, condition, horizon: hQ, band: bandQ } = req.query;
    if (!device) return res.status(400).json({ error: "Missing device" });
    const info = getIphoneProDevice(device);
    if (!info) return res.status(404).json({ error: "Unknown iPhone Pro device" });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) return res.status(400).json({ error: "Invalid or missing storage" });

    const cond = typeof condition === "string" ? condition : "Excellent";
    const horizon = Math.max(0, parseNumber(hQ, 24));
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) return res.status(400).json({ error: "Invalid release date in catalog" });

    // Backfill full history since release
    const msPerDay = 86400000;
    const today = new Date();
    const days = (today - releaseDate) / msPerDay;
    const ageMonths = Math.max(0, days / 30.44);
    const backfill = Math.ceil(ageMonths);

    const modelKey = info.fitModelKey || "iphone_pro";
    const launchPrice = resolveIphoneProLaunch(device, storageGb);
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
    console.error("/api/iphone-pro-predictions error", err);
    res.status(500).json({ error: "Internal error computing iPhone Pro predictions" });
  }
});

// GET /api/iphone-pro-sense?device=iphone_14_pro&storage=256&condition=Good&band=0.1
router.get("/iphone-pro-sense", (req, res) => {
  try {
    const { device, storage, condition, band: bandQ } = req.query;
    if (!device) return res.status(400).json({ error: "Missing device" });
    const info = getIphoneProDevice(device);
    if (!info) return res.status(404).json({ error: "Unknown iPhone Pro device" });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) return res.status(400).json({ error: "Invalid or missing storage" });

    const cond = typeof condition === "string" ? condition : "Excellent";
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) return res.status(400).json({ error: "Invalid release date in catalog" });

    const modelKey = info.fitModelKey || "iphone_pro";
    const launchPrice = resolveIphoneProLaunch(device, storageGb);
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
    console.error("/api/iphone-pro-sense error", err);
    res.status(500).json({ error: "Internal error computing iPhone Pro sense value" });
  }
});

export default router;
