// models/iphoneProCatalog.js
// Catalog for iPhone Pro generations 12 through 17 with per-storage launch MSRPs.
// Underlying pricing curve used is MODELS['iphone_pro'] in iphonePricingModel.
// Prices are USD; future model (17) uses provisional placeholders to be updated.

const IPHONE_PRO_CATALOG = {
  iphone_12_pro: {
    name: "iPhone 12 Pro",
    release: "2020-10-23",
    announced: "2020-10-13",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299 },
    fitModelKey: "iphone_pro",
  },
  iphone_13_pro: {
    name: "iPhone 13 Pro",
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  iphone_14_pro: {
    name: "iPhone 14 Pro",
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  iphone_15_pro: {
    name: "iPhone 15 Pro",
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  iphone_16_pro: {
    name: "iPhone 16 Pro",
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 256: 1099, 512: 1299, 1024: 1499 }, // 128GB likely dropped
    fitModelKey: "iphone_pro",
  },
  iphone_17_pro: {
    name: "iPhone 17 Pro",
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 1199, 512: 1399, 1024: 1599 }, // provisional
    fitModelKey: "iphone_pro",
  },
};

function listIphoneProDevices() {
  return Object.entries(IPHONE_PRO_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getIphoneProDevice(key) {
  return IPHONE_PRO_CATALOG[key] || null;
}

function resolveIphoneProLaunch(key, storageGb) {
  const info = getIphoneProDevice(key);
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

export { listIphoneProDevices, getIphoneProDevice, resolveIphoneProLaunch };
