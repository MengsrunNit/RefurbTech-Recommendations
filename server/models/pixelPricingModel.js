// models/pixelPricingModel.js

// === Pixel Model Fit (Age + categorical Storage + Condition) ===
const INTERCEPT = 0.7102739207997484;
const B_AGE = -0.010343;
const STORAGE = { 128: -0.014967, 256: 0.014967, 512: 0.0 };
const CONDITION = {
  Excellent: 0.041479,
  "Very Good": -0.006208,
  Good: -0.035270,
};

function parseNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function monthsBetween(fromDate, toDate) {
  // Approximate months as days/30.44
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = (toDate.getTime() - fromDate.getTime()) / msPerDay;
  return days / 30.44;
}

function computeRatio(ageMonths, storageGb, condition) {
  return (
    INTERCEPT +
    B_AGE * ageMonths +
    (STORAGE[storageGb] || 0) +
    (CONDITION[condition] || 0)
  );
}

/**
 * Compute prediction series (time curve).
 */
function getPredictionSeries({
  releaseDate,
  launchPrice,
  storageGb,
  condition,
  horizon = 24,
  backfill = 6,
  band = 0.1,
}) {
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
    const ratio = computeRatio(age, storageGb, condition);
    const priceUSD = Math.max(0, ratio * launchPrice);
    const priceLowUSD = Math.max(0, (1 - safeBand) * priceUSD);
    const priceHighUSD = Math.max(0, (1 + safeBand) * priceUSD);

    series.push({
      ageMonths: Number(age.toFixed(2)),
      priceUSD: Number(priceUSD.toFixed(2)),
      priceLowUSD: Number(priceLowUSD.toFixed(2)),
      priceHighUSD: Number(priceHighUSD.toFixed(2)),
    });
  }

  return {
    meta: {
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
 * Compute current value “sense” for today only.
 */
function senseCurrentValue({ releaseDate, launchPrice, storageGb, condition, band = 0.1 }) {
  const safeBand = Math.max(0, Math.min(0.9, band));
  const todayAge = Math.max(0, monthsBetween(releaseDate, new Date()));

  const ratio = computeRatio(todayAge, storageGb, condition);
  const priceUSD = Math.max(0, ratio * launchPrice);
  const priceLowUSD = Math.max(0, (1 - safeBand) * priceUSD);
  const priceHighUSD = Math.max(0, (1 + safeBand) * priceUSD);

  return {
    meta: {
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

export {
  STORAGE,
  CONDITION,
  parseNumber,
  getPredictionSeries,
  senseCurrentValue,
};
