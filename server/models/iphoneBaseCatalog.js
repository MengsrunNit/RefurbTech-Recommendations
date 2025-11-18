// models/iphoneBaseCatalog.js
// Catalog for iPhone base (non-Pro) generations 12 through 17 with per-storage launch MSRPs.
// Underlying regression fit used is MODELS['iphone_base'] in iphonePricingModel.
// Prices are USD; future model (17) uses provisional placeholders to be updated.

const IPHONE_BASE_CATALOG = {
  iphone_12: {
    name: "iPhone 12",
    release: "2020-10-23",
    announced: "2020-10-13",
    launchByStorage: { 64: 799, 128: 849, 256: 949 },
    fitModelKey: "iphone_base",
  },
  iphone_13: {
    name: "iPhone 13",
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  iphone_14: {
    name: "iPhone 14",
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  iphone_15: {
    name: "iPhone 15",
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  iphone_16: {
    name: "iPhone 16",
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  iphone_17: {
    name: "iPhone 17",
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 799, 512: 999 }, // provisional
    fitModelKey: "iphone_base",
  },
};

function listIphoneBaseDevices() {
  return Object.entries(IPHONE_BASE_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getIphoneBaseDevice(key) {
  return IPHONE_BASE_CATALOG[key] || null;
}

function resolveIphoneBaseLaunch(key, storageGb) {
  const info = getIphoneBaseDevice(key);
  if (!info) return null;
  const map = info.launchByStorage || {};
  const direct = map[storageGb];
  if (direct != null) return direct;
  const sizes = Object.keys(map).map((s) => Number(s));
  if (!sizes.length) return null;
  const closest = sizes.reduce((best, s) =>
    Math.abs(s - storageGb) < Math.abs(best - storageGb) ? s : best,
    sizes[0]
  );
  return map[closest] ?? null;
}

export { listIphoneBaseDevices, getIphoneBaseDevice, resolveIphoneBaseLaunch };
