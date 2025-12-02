
// models/samsungPlusCatalog.js
// Catalog for Samsung Galaxy S Plus (S22+ through S25+) with per-storage launch MSRPs.
// Underlying pricing curve used is MODELS['samsung_plus'] in samsungPricingModel.
// Prices are USD; S25+ pricing based on official US launch MSRPs.

const SAMSUNG_PLUS_CATALOG = {
  galaxy_s22_plus: {
    name: "Samsung Galaxy S22+",
    // Series announced 2022-02-09, available 2022-02-25
    release: "2022-02-25",
    announced: "2022-02-09",
    // US launch MSRPs (approx, rounded to whole dollars)
    launchByStorage: { 128: 999, 256: 1049 },
    fitModelKey: "samsung_plus",
  },
  galaxy_s23_plus: {
    name: "Samsung Galaxy S23+",
    // Series announced 2023-02-01, available 2023-02-17
    release: "2023-02-17",
    announced: "2023-02-01",
    // S23+ moved base to 256GB; 512GB tier added
    launchByStorage: { 256: 999, 512: 1199 },
    fitModelKey: "samsung_plus",
  },
  galaxy_s24_plus: {
    name: "Samsung Galaxy S24+",
    // Series announced 2024-01-17, available 2024-01-31
    release: "2024-01-31",
    announced: "2024-01-17",
    // Launch pricing: $999.99 (256GB) in US; 512GB inferred from standard Samsung tiering
    launchByStorage: { 256: 999, 512: 1119 },
    fitModelKey: "samsung_plus",
  },
  galaxy_s25_plus: {
    name: "Samsung Galaxy S25+",
    // Series announced 2025-01-22, available 2025-02-07
    release: "2025-02-07",
    announced: "2025-01-22",
    // Official US starting price $999.99 for 256GB; 512GB at $1,119.99
    launchByStorage: { 256: 999, 512: 1119 },
    fitModelKey: "samsung_plus",
  },
};

function listSamsungPlusDevices() {
  return Object.entries(SAMSUNG_PLUS_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getSamsungPlusDevice(key) {
  return SAMSUNG_PLUS_CATALOG[key] || null;
}

function resolveSamsungPlusLaunch(key, storageGb) {
  const info = getSamsungPlusDevice(key);
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

export { listSamsungPlusDevices, getSamsungPlusDevice, resolveSamsungPlusLaunch };
