// controllers/samsungController.js
// Controller functions for Samsung (Galaxy S) catalog & pricing.

import {
  listSamsungBaseDevices,
  getSamsungBaseDevice,
  resolveSamsungBaseLaunch,
} from "../models/samsungBaseCatalog.js";

import {
  listSamsungPlusDevices,
  getSamsungPlusDevice,
  resolveSamsungPlusLaunch,
} from "../models/samsungPlusCatalog.js";

import {
  listSamsungUltraDevices,
  getSamsungUltraDevice,
  resolveSamsungUltraLaunch,
} from "../models/samsungUltraCatalog.js";

import { getPredictionSeries, parseNumber } from "../models/samsungPricingModel.js";

// Small helper to pick catalog + model based on tier
// tiers: base | plus | ultra
function getTierConfig(tierRaw) {
  const tier = String(tierRaw || "").trim().toLowerCase();

  if (tier === "base") {
    return {
      tier: "base",
      listDevices: listSamsungBaseDevices,
      getDevice: getSamsungBaseDevice,
      resolveLaunch: resolveSamsungBaseLaunch,
      defaultModelKey: "samsung_base",
    };
  }

  if (tier === "plus") {
    return {
      tier: "plus",
      listDevices: listSamsungPlusDevices,
      getDevice: getSamsungPlusDevice,
      resolveLaunch: resolveSamsungPlusLaunch,
      defaultModelKey: "samsung_plus",
    };
  }

  if (tier === "ultra") {
    return {
      tier: "ultra",
      listDevices: listSamsungUltraDevices,
      getDevice: getSamsungUltraDevice,
      resolveLaunch: resolveSamsungUltraLaunch,
      defaultModelKey: "samsung_ultra",
    };
  }

  return null;
}

// GET /api/samsung-models?tier=base|plus|ultra
export const listSamsungModels = (req, res) => {
  try {
    const { tier } = req.query;
    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'plus', or 'ultra')" });
    }

    const devices = cfg.listDevices();
    res.json({ tier: cfg.tier, devices });
  } catch (err) {
    console.error("/api/samsung-models error", err);
    res.status(500).json({ error: "Failed to list Samsung devices" });
  }
};

// GET /api/samsung-predictions?tier=base|plus|ultra&device=galaxy_s23&storage=256&condition=Excellent&horizon=12&band=0.1
export const getSamsungPredictions = (req, res) => {
  try {
    const { tier, device, storage, condition, horizon: hQ, band: bandQ } = req.query;

    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'plus', or 'ultra')" });
    }

    if (!device) return res.status(400).json({ error: "Missing device" });

    const info = cfg.getDevice(device);
    if (!info) return res.status(404).json({ error: `Unknown Samsung ${cfg.tier} device` });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) {
      return res.status(400).json({ error: "Invalid or missing storage" });
    }

    const cond = typeof condition === "string" ? condition : "Excellent";
    const horizon = Math.max(0, parseNumber(hQ, 24));
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) {
      return res.status(400).json({ error: "Invalid release date in catalog" });
    }

    // Backfill = full history from release to today
    const msPerDay = 86400000;
    const today = new Date();
    const days = (today - releaseDate) / msPerDay;
    const ageMonths = Math.max(0, days / 30.44);
    const backfill = Math.ceil(ageMonths);

    const modelKey = info.fitModelKey || cfg.defaultModelKey;
    const launchPrice = cfg.resolveLaunch(device, storageGb);

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

    result.meta = result.meta || {};
    result.meta.catalogTier = cfg.tier;
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;

    res.json(result);
  } catch (err) {
    console.error("/api/samsung-predictions error", err);
    res.status(500).json({ error: "Internal error computing Samsung predictions" });
  }
};

// GET /api/samsung-sense?tier=base|plus|ultra&device=galaxy_s23&storage=256&condition=Very%20Good&band=0.1
export const getSamsungSense = (req, res) => {
  try {
    const { tier, device, storage, condition, band: bandQ } = req.query;

    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'plus', or 'ultra')" });
    }

    if (!device) return res.status(400).json({ error: "Missing device" });

    const info = cfg.getDevice(device);
    if (!info) return res.status(404).json({ error: `Unknown Samsung ${cfg.tier} device` });

    const storageGb = parseInt(storage, 10);
    if (!Number.isFinite(storageGb)) {
      return res.status(400).json({ error: "Invalid or missing storage" });
    }

    const cond = typeof condition === "string" ? condition : "Excellent";
    const band = Math.max(0, Math.min(0.9, parseNumber(bandQ, 0.1)));

    const releaseDate = new Date(info.release);
    if (isNaN(releaseDate.getTime())) {
      return res.status(400).json({ error: "Invalid release date in catalog" });
    }

    const modelKey = info.fitModelKey || cfg.defaultModelKey;
    const launchPrice = cfg.resolveLaunch(device, storageGb);

    const result = getPredictionSeries({
      modelKey,
      releaseDate,
      storageGb,
      condition: cond,
      horizon: 0,
      backfill: 0, // single point (today)
      band,
      launchPrice,
    });

    result.meta = result.meta || {};
    result.meta.catalogTier = cfg.tier;
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;

    res.json(result);
  } catch (err) {
    console.error("/api/samsung-sense error", err);
    res.status(500).json({ error: "Internal error computing Samsung sense value" });
  }
};
