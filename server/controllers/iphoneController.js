// controllers/iphoneController.js
// Controller functions for iPhone catalog & pricing.

import {
  listIphoneBaseDevices,
  getIphoneBaseDevice,
  resolveIphoneBaseLaunch,
} from "../models/iphoneBaseCatalog.js";

import {
  listIphoneProDevices,
  getIphoneProDevice,
  resolveIphoneProLaunch,
} from "../models/iphoneProCatalog.js";

import {
  listIphoneProMaxDevices,
  getIphoneProMaxDevice,
  resolveIphoneProMaxLaunch,
} from "../models/iphoneProMaxCatalog.js";

import { getPredictionSeries, parseNumber } from "../models/iphonePricingModel.js";

// Small helper to pick catalog + model based on tier
function getTierConfig(tierRaw) {
  const tier = String(tierRaw || "").trim().toLowerCase();

  if (tier === "base") {
    return {
      tier: "base",
      listDevices: listIphoneBaseDevices,
      getDevice: getIphoneBaseDevice,
      resolveLaunch: resolveIphoneBaseLaunch,
      defaultModelKey: "iphone_base",
    };
  }

  if (tier === "pro") {
    return {
      tier: "pro",
      listDevices: listIphoneProDevices,
      getDevice: getIphoneProDevice,
      resolveLaunch: resolveIphoneProLaunch,
      defaultModelKey: "iphone_pro",
    };
  }

  if (tier === "pro_max" || tier === "promax" || tier === "pro max" || tier === "pro-max") {
    return {
      tier: "pro_max",
      listDevices: listIphoneProMaxDevices,
      getDevice: getIphoneProMaxDevice,
      resolveLaunch: resolveIphoneProMaxLaunch,
      defaultModelKey: "iphone_pro_max",
    };
  }

  return null;
}

// GET /api/iphone-models?tier=base|pro|pro_max
export const listIphoneModels = (req, res) => {
  try {
    const { tier } = req.query;
    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'pro', or 'pro_max')" });
    }

    const devices = cfg.listDevices();
    res.json({ tier: cfg.tier, devices });
  } catch (err) {
    console.error("/api/iphone-models error", err);
    res.status(500).json({ error: "Failed to list iPhone devices" });
  }
};

// GET /api/iphone-predictions?tier=base|pro|pro_max&device=iphone_14&storage=128&condition=Excellent&horizon=12&band=0.1
export const getIphonePredictions = (req, res) => {
  try {
    const { tier, device, storage, condition, horizon: hQ, band: bandQ } = req.query;

    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'pro', or 'pro_max')" });
    }

    if (!device) return res.status(400).json({ error: "Missing device" });

    const info = cfg.getDevice(device);
    if (!info) return res.status(404).json({ error: `Unknown iPhone ${cfg.tier} device` });

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

    result.meta.catalogTier = cfg.tier;
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;

    res.json(result);
  } catch (err) {
    console.error("/api/iphone-predictions error", err);
    res.status(500).json({ error: "Internal error computing iPhone predictions" });
  }
};

// GET /api/iphone-sense?tier=base|pro|pro_max&device=iphone_14&storage=128&condition=Very%20Good&band=0.1
export const getIphoneSense = (req, res) => {
  try {
    const { tier, device, storage, condition, band: bandQ } = req.query;

    const cfg = getTierConfig(tier);
    if (!cfg) {
      return res
        .status(400)
        .json({ error: "Invalid or missing tier (use 'base', 'pro', or 'pro_max')" });
    }

    if (!device) return res.status(400).json({ error: "Missing device" });

    const info = cfg.getDevice(device);
    if (!info) return res.status(404).json({ error: `Unknown iPhone ${cfg.tier} device` });

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

    result.meta.catalogTier = cfg.tier;
    result.meta.catalogDeviceKey = device;
    result.meta.catalogDeviceName = info.name;
    result.meta.catalogResolvedLaunch = launchPrice;

    res.json(result);
  } catch (err) {
    console.error("/api/iphone-sense error", err);
    res.status(500).json({ error: "Internal error computing iPhone sense value" });
  }
};
