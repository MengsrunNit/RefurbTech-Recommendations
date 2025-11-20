// models/iphoneProMaxCatalog.js
// Catalog for iPhone Pro Max generations with per-storage launch MSRPs.
// Uses MODELS['iphone_pro_max'] in iphonePricingModel for the pricing curve.

const IPHONE_PRO_MAX_CATALOG = {
  iphone_12_pro_max: {
    name: "iPhone 12 Pro Max",
    release: "2020-11-13",
    announced: "2020-10-13",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399 },
    fitModelKey: "iphone_pro_max",
  },
  iphone_13_pro_max: {
    name: "iPhone 13 Pro Max",
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  iphone_14_pro_max: {
    name: "iPhone 14 Pro Max",
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  iphone_15_pro_max: {
    name: "iPhone 15 Pro Max",
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  iphone_16_pro_max: {
    name: "iPhone 16 Pro Max",
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  iphone_17_pro_max: {
    name: "iPhone 17 Pro Max",
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 1299, 512: 1499, 1024: 1699 }, // provisional
    fitModelKey: "iphone_pro_max",
  },
};

function listIphoneProMaxDevices() {
  return Object.entries(IPHONE_PRO_MAX_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getIphoneProMaxDevice(key) {
  return IPHONE_PRO_MAX_CATALOG[key] || null;
}

function resolveIphoneProMaxLaunch(key, storageGb) {
  const info = getIphoneProMaxDevice(key);
  if (!info) return null;
  const map = info.launchByStorage || {};
  const direct = map[storageGb];
  if (direct != null) return direct;
  const sizes = Object.keys(map)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
  if (!sizes.length) return null;
  const closest = sizes.reduce(
    (best, s) =>
      Math.abs(s - storageGb) < Math.abs(best - storageGb) ? s : best,
    sizes[0]
  );
  return map[closest] ?? null;
}

export {
  listIphoneProMaxDevices,
  getIphoneProMaxDevice,
  resolveIphoneProMaxLaunch,
};
