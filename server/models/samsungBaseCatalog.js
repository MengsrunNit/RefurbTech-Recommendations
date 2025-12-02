// models/samsungBaseCatalog.js
// Catalog for Samsung Galaxy S *base* (non-Plus / non-Ultra) generations S21 through S25
// with per-storage launch MSRPs.
//
// Prices are USD. Launch MSRPs are approximate US list at launch.
// S25 uses provisional placeholders to be updated once official per-storage MSRPs are finalized.

const SAMSUNG_BASE_CATALOG = {
  galaxy_s22: {
    name: "Samsung Galaxy S22",
    // Unpacked: 2022-02-09, release: 2022-02-25
    announced: "2022-02-09",
    release: "2022-02-25",
    // Originally available at $799 for base storage;
    // 256 GB estimated following typical +$50 tier step.
    launchByStorage: {
      128: 799,
      256: 849,
    },
    fitModelKey: "samsung_base",
  },
  galaxy_s23: {
    name: "Samsung Galaxy S23",
    // Announced 2023-02-01, available 2023-02-17
    announced: "2023-02-01",
    release: "2023-02-17",
    // PhoneArena / launch pricing: $799 (128 GB), $859 (256 GB).
    launchByStorage: {
      128: 799,
      256: 859,
    },
    fitModelKey: "samsung_base",
  },
  galaxy_s24: {
    name: "Samsung Galaxy S24",
    // Announced 2024-01-17, available 2024-01-31
    announced: "2024-01-17",
    release: "2024-01-31",
    // TechRadar / launch pricing pattern: $799.99 (128 GB), $859.99 (256 GB); rounded.
    launchByStorage: {
      128: 799,
      256: 859,
      // 512 GB exists only in some regions; add if you need it:
      // 512: 999,
    },
    fitModelKey: "samsung_base",
  },
  galaxy_s25: {
    name: "Samsung Galaxy S25",
    // Announced at Unpacked in San Jose on 2025-01-22, retail availability from 2025-02-07.
    announced: "2025-01-22",
    release: "2025-02-07",
    // Series pricing starts at ~$799; per-storage breakdown is still stabilizing.
    // These are provisional placeholders; update once official MSRPs are fully known.
    launchByStorage: {
      128: 799, // provisional
      256: 859, // provisional
    },
    fitModelKey: "samsung_base",
  },
};

function listSamsungBaseDevices() {
  return Object.entries(SAMSUNG_BASE_CATALOG).map(([key, info]) => ({
    key,
    name: info.name,
    release: info.release,
    announced: info.announced,
    storages: Object.keys(info.launchByStorage).map((s) => Number(s)),
    launchByStorage: info.launchByStorage,
    fitModelKey: info.fitModelKey,
  }));
}

function getSamsungBaseDevice(key) {
  return SAMSUNG_BASE_CATALOG[key] || null;
}

function resolveSamsungBaseLaunch(key, storageGb) {
  const info = getSamsungBaseDevice(key);
  if (!info) return null;
  const map = info.launchByStorage || {};
  const direct = map[storageGb];
  if (direct != null) return direct;
  const sizes = Object.keys(map).map((s) => Number(s));
  if (!sizes.length) return null;
  const closest = sizes.reduce(
    (best, s) =>
      Math.abs(s - storageGb) < Math.abs(best - best) ? s : best,
    sizes[0]
  );
  return map[closest] ?? null;
}

export {
  SAMSUNG_BASE_CATALOG,
  listSamsungBaseDevices,
  getSamsungBaseDevice,
  resolveSamsungBaseLaunch,
};
