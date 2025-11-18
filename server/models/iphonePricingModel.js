// server/models/iphonePricingModel.js
// Pixel-style iPhone pricing model:
// - Age modeled via exponential decay in ratio space
// - Small additive bumps for storage & condition
// - Output ratios * launchPrice

function parseNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// === iPhone Model Fit (Age + categorical Storage + Condition) ===
// INTERCEPT here acts as approximate ratio near launch (age ~0)

// Per-family knobs so you can tune base vs Pro vs Pro Max separately.
const MODELS = {
  iphone_base: {
    name: "iPhone Base",
    samples: 475,
    intercept: 0.78,     // tweak: ratio at launch for base
    floorRatio: 0.30,    // long-run floor ratio
    halfLifeMonths: 20,  // decay rate in months
    STORAGE: {           // storage bumps relative to "typical" size
      64: -0.02,
      128: 0.0,
      256: 0.02,
      512: 0.04,
      1024: 0.06,
    },
    CONDITION: {
      Excellent: 0.035,
      "Very Good": -0.005,
      Good: -0.03,
    },
  },
  iphone_pro: {
    name: "iPhone Pro",
    samples: 485,
    intercept: 0.80,
    floorRatio: 0.32,
    halfLifeMonths: 20,
    STORAGE: {
      128: 0.0,
      256: 0.02,
      512: 0.04,
      1024: 0.06,
    },
    CONDITION: {
      Excellent: 0.04,
      "Very Good": -0.003,
      Good: -0.03,
    },
  },
  iphone_pro_max: {
    name: "iPhone Pro Max",
    samples: 532,
    intercept: 0.82,
    floorRatio: 0.33,
    halfLifeMonths: 20,
    STORAGE: {
      128: 0.0,
      256: 0.02,
      512: 0.04,
      1024: 0.06,
    },
    CONDITION: {
      Excellent: 0.04,
      "Very Good": -0.002,
      Good: -0.03,
    },
  },
};

function monthsBetween(fromDate, toDate) {
  // Approximate months as days/30.44 (same as Pixel)
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = (toDate.getTime() - fromDate.getTime()) / msPerDay;
  return days / 30.44;
}

function baseAgeRatio(modelKey, ageMonths) {
  const model = MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown iPhone model key: ${modelKey}`);
  }

  const age = Math.max(0, ageMonths);
  const { intercept, floorRatio, halfLifeMonths } = model;

  const k = Math.log(2) / halfLifeMonths; // decay rate

  // Exponential decay from INTERCEPT down toward floorRatio:
  // ratio_age(age) = floorRatio + (intercept - floorRatio) * exp(-k * age)
  return floorRatio + (intercept - floorRatio) * Math.exp(-k * age);
}

/**
 * Compute ratio given age, storage, and condition for a specific iPhone family.
 * Mirrors Pixel's computeRatio behavior.
 */
function computeRatio(modelKey, ageMonths, storageGb, condition) {
  const model = MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown iPhone model key: ${modelKey}`);
  }

  const ageComponent = baseAgeRatio(modelKey, ageMonths);
  const storageAdj =
    (model.STORAGE && model.STORAGE[storageGb]) != null
      ? model.STORAGE[storageGb]
      : 0;
  const condAdj =
    (model.CONDITION && model.CONDITION[condition]) != null
      ? model.CONDITION[condition]
      : 0;

  // Small additive bumps on top of the age curve
  const ratio = ageComponent + storageAdj + condAdj;

  // Safety: clamp to [0, 1.2] (same spirit as Pixel)
  return Math.max(0, Math.min(1.2, ratio));
}

/**
 * Compute prediction series (time curve) for a given iPhone family key.
 * Very similar shape to Pixel's getPredictionSeries, but with modelKey metadata.
 */
function getPredictionSeries({
  modelKey,        // 'iphone_base' | 'iphone_pro' | 'iphone_pro_max'
  releaseDate,
  launchPrice,
  storageGb,
  condition,
  horizon = 24,
  backfill = 6,
  band = 0.1,
}) {
  const model = MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown iPhone model: ${modelKey}`);
  }

  const today = new Date();
  const todayAgeRaw = monthsBetween(releaseDate, today);
  const todayAge = Math.max(0, todayAgeRaw);

  const safeHorizon = Math.max(0, Math.floor(horizon));
  const safeBackfill = Math.max(0, Math.floor(backfill));
  const safeBand = Math.max(0, Math.min(0.9, band));

  const startAge = Math.max(0, todayAge - safeBackfill);
  const endAge = todayAge + safeHorizon;

  const series = [];
  for (let age = startAge; age <= endAge + 1e-9; age += 1) {
    const ratio = computeRatio(modelKey, age, storageGb, condition);
    const priceUSD = Math.max(0, ratio * launchPrice);
    const priceLowUSD = Math.max(0, (1 - safeBand) * priceUSD);
    const priceHighUSD = Math.max(0, (1 + safeBand) * priceUSD);

    series.push({
      ageMonths: Number(age.toFixed(2)),
      ratio: Number(ratio.toFixed(4)),
      priceUSD: Number(priceUSD.toFixed(2)),
      priceLowUSD: Number(priceLowUSD.toFixed(2)),
      priceHighUSD: Number(priceHighUSD.toFixed(2)),
    });
  }

  return {
    meta: {
      modelKey,
      modelName: model.name,
      samples: model.samples,
      release: releaseDate.toISOString().slice(0, 10),
      todayAge: Number(todayAge.toFixed(2)),
      storageGb,
      condition,
      launchPrice,
      horizon: safeHorizon,
      backfill: safeBackfill,
      band: safeBand,
    },
    series,
  };
}

/**
 * Compute current value “sense” for today only (mirrors Pixel's senseCurrentValue).
 */
function senseCurrentValue({
  modelKey,
  releaseDate,
  launchPrice,
  storageGb,
  condition,
  band = 0.1,
}) {
  const model = MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown iPhone model: ${modelKey}`);
  }

  const safeBand = Math.max(0, Math.min(0.9, band));
  const todayAge = Math.max(0, monthsBetween(releaseDate, new Date()));

  const ratio = computeRatio(modelKey, todayAge, storageGb, condition);
  const priceUSD = Math.max(0, ratio * launchPrice);
  const priceLowUSD = Math.max(0, (1 - safeBand) * priceUSD);
  const priceHighUSD = Math.max(0, (1 + safeBand) * priceUSD);

  return {
    meta: {
      modelKey,
      modelName: model.name,
      samples: model.samples,
      release: releaseDate.toISOString().slice(0, 10),
      todayAge: Number(todayAge.toFixed(2)),
      storageGb,
      condition,
      launchPrice,
      band: safeBand,
    },
    value: {
      priceUSD: Number(priceUSD.toFixed(2)),
      ratio: Number(ratio.toFixed(4)),
      priceLowUSD: Number(priceLowUSD.toFixed(2)),
      priceHighUSD: Number(priceHighUSD.toFixed(2)),
    },
  };
}

function listModels() {
  return Object.keys(MODELS).map((k) => ({
    key: k,
    name: MODELS[k].name,
    samples: MODELS[k].samples,
  }));
}

export {
  MODELS,
  parseNumber,
  monthsBetween,
  baseAgeRatio,
  computeRatio,
  getPredictionSeries,
  senseCurrentValue,
  listModels,
};
