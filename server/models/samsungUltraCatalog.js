// models/samsungUltraCatalog.js
// Catalog for Samsung Galaxy S Ultra (S22 Ultra through S25 Ultra) with per-storage launch MSRPs.
// Underlying pricing curve used is MODELS['samsung_ultra'] in samsungPricingModel.
// Prices are USD; S25 Ultra uses launch MSRPs but can be tweaked if Samsung changes tiering.

const SAMSUNG_ULTRA_CATALOG = {
  galaxy_s22_ultra: {
    name: "Samsung Galaxy S22 Ultra",
    // Unpacked: 2022-02-09, wide release: 2022-02-25
    release: "2022-02-25",
    announced: "2022-02-09",
    // US launch MSRPs by storage (rounded to whole dollars)
    // 8/128, 12/256, 12/512, 12/1TB
    launchByStorage: { 128: 1199, 256: 1299, 512: 1399, 1024: 1599 },
    fitModelKey: "samsung_ultra",
  },
  galaxy_s23_ultra: {
    name: "Samsung Galaxy S23 Ultra",
    // Announced: 2023-02-01, release: 2023-02-17
    release: "2023-02-17",
    announced: "2023-02-01",
    // US launch MSRPs by storage; base moved to 256GB
    // 256GB: $1,199, 512GB: $1,299, 1TB: $1,619
    launchByStorage: { 256: 1199, 512: 1299, 1024: 1619 },
    fitModelKey: "samsung_ultra",
  },
  galaxy_s24_ultra: {
    name: "Samsung Galaxy S24 Ultra",
    // Announced: 2024-01-17, release: 2024-01-31
    release: "2024-01-31",
    announced: "2024-01-17",
    // Official US launch MSRPs:
    // 256GB: $1,299.99, 512GB: $1,419.99, 1TB: $1,659.99 (rounded)
    launchByStorage: { 256: 1299, 512: 1419, 1024: 1659 },
    fitModelKey: "samsung_ultra",
  },
  galaxy_s25_ultra: {
    name: "Samsung Galaxy S25 Ultra",
    // Announced: 2025-01-22, release: 2025-02-07
    release: "2025-02-07",
    announced: "2025-01-22",
    // Launch MSRPs (same starting price as S24 Ultra; higher tiers
    // follow the same +$120 / +$360 pattern; adjust if Samsung revises):
    // 256GB: $1,299.99, 512GB: $1,419.99, 1TB: $1,659.99
    launchByStorage: { 256: 1299, 512: 1419, 1024: 1659 },
    fitModelKey: "samsung_ultra",
  },
};

function listSamsungUltraDevices() {
  return Object.entries(SAMSUNG_ULTRA_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getSamsungUltraDevice(key) {
  return SAMSUNG_ULTRA_CATALOG[key] || null;
}

function resolveSamsungUltraLaunch(key, storageGb) {
  const info = getSamsungUltraDevice(key);
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
  SAMSUNG_ULTRA_CATALOG,
  listSamsungUltraDevices,
  getSamsungUltraDevice,
  resolveSamsungUltraLaunch,
};
