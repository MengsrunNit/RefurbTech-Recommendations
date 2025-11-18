// models/pixelModelRegistry.js
// Registry of canonical Pixel models with release dates and per-storage launch MSRPs.
// These were previously duplicated in the frontend; moving here enables the
// frontend to fetch authoritative data and simplifies adding new models.

// NOTE: Adjust or extend as new official pricing becomes available.
const PIXEL_MODELS = {
  "pixel_6": {
    name: "Pixel 6",
    release: "2021-10-28",
    launchByStorage: { 128: 599, 256: 699 },
  },
  "pixel_7": {
    name: "Pixel 7",
    release: "2022-10-13",
    launchByStorage: { 128: 599, 256: 699 },
  },
  "pixel_8": {
    name: "Pixel 8",
    release: "2023-10-12",
    launchByStorage: { 128: 699, 256: 759 },
  },
  "pixel_9": {
    name: "Pixel 9",
    release: "2024-08-13",
    launchByStorage: { 128: 799, 256: 899 },
  },
  // Provisional future model (placeholder values; update when official)
  "pixel_10": {
    name: "Pixel 10",
    release: "2025-10-10",
    launchByStorage: { 128: 799, 256: 899 },
  },
};

function listPixelModels() {
  return Object.entries(PIXEL_MODELS).map(([key, info]) => {
    return {
      key,
      name: info.name,
      release: info.release,
      storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
      launchByStorage: info.launchByStorage,
    };
  });
}

function getPixelModel(key) {
  return PIXEL_MODELS[key] || null;
}

function resolveLaunchPrice(modelKey, storageGb) {
  const info = getPixelModel(modelKey);
  if (!info) return null;
  const map = info.launchByStorage || {};
  const direct = map[storageGb];
  if (direct != null) return direct;
  const sizes = Object.keys(map)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
  if (!sizes.length) return null;
  const closest = sizes.reduce((best, s) =>
    Math.abs(s - storageGb) < Math.abs(best - storageGb) ? s : best,
    sizes[0]
  );
  return map[closest] ?? null;
}

export { listPixelModels, getPixelModel, resolveLaunchPrice };
