import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  computeRatio,
  monthsBetween,
  senseCurrentValue as senseIphone,
} from "../models/iphonePricingModel.js";
import { senseCurrentValue as sensePixel } from "../models/pixelPricingModel.js";
import { resolveLaunchPrice } from "../models/pixelModelRegistry.js";
import { resolveIphoneBaseLaunch } from "../models/iphoneBaseCatalog.js";
import { resolveIphoneProLaunch } from "../models/iphoneProCatalog.js";
import { resolveIphoneProMaxLaunch } from "../models/iphoneProMaxCatalog.js";
import { getDb } from "../utils/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../phone_data");

// Cache for loaded phones
let allPhonesCache = null;

const getFitModelKey = (title) => {
  const t = title.toLowerCase();
  if (t.includes("iphone")) {
    if (t.includes("pro max")) return "iphone_pro_max";
    if (t.includes("pro")) return "iphone_pro";
    return "iphone_base";
  }
  if (t.includes("galaxy s")) {
    // Exclude FE models if we want to be strict about "S series" main line
    if (t.includes("fe")) return null;
    if (t.includes("ultra")) return "samsung_ultra";
    if (t.includes("plus") || t.includes("+")) return "samsung_plus";
    return "samsung_base";
  }
  if (t.includes("pixel")) {
    return "pixel";
  }
  return null;
};

const resolveIphoneKey = (title) => {
  const t = title.toLowerCase();
  const match = t.match(/iphone\s*(\d+)/);
  if (!match) return null;
  const num = match[1];

  if (t.includes("pro max")) return `iphone_${num}_pro_max`;
  if (t.includes("pro")) return `iphone_${num}_pro`;
  return `iphone_${num}`;
};

const loadPhones = async () => {
  if (allPhonesCache) return allPhonesCache;

  let phones = [];
  try {
    const db = await getDb();
    phones = await db.collection("phones").find({}).toArray();
    console.log(`Loaded ${phones.length} phones from MongoDB`);
  } catch (err) {
    console.error("Error loading phones from DB, falling back to files:", err);
    // Fallback to files
    const files = [
      "google_pixel_phones.json",
      "iphone_gsmarena_phones.json",
      "oneplus_phones.json",
      "samsung_major_series_phones.json",
    ];

    files.forEach((file) => {
      try {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, "utf8");
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            phones = phones.concat(json);
          }
        }
      } catch (e) {
        console.error(`Error loading ${file}:`, e);
      }
    });
  }

  // Normalize data
  allPhonesCache = phones.map((p) => {
    const releaseDateStr = p.specs?.release_date;
    let year = 0;
    let releaseDate = null;

    if (releaseDateStr) {
      const match = releaseDateStr.match(/(\d{4})/);
      if (match) year = parseInt(match[1], 10);

      const d = new Date(releaseDateStr);
      if (!isNaN(d.getTime())) {
        releaseDate = d;
      }
    }

    // Basic price normalization (using msrp_usd if available)
    let launchPrice = p.specs?.msrp_usd || 9999;

    // Detect telephoto
    const cameras = p.specs?.rear_camera_setup || [];
    const hasTelephoto = cameras.some(
      (c) =>
        c.type === "telephoto" ||
        (c.details && c.details.toLowerCase().includes("telephoto"))
    );

    // Screen size
    const screenSize = p.specs?.display?.size_in || 0;

    // Storage
    const storageOptions = p.specs?.storage_options_gb || [];
    const baseStorage =
      storageOptions.length > 0 ? Math.min(...storageOptions) : 128;

    // Calculate Current Price using Price Track Logic
    let currentPrice = launchPrice;
    let priceLow = launchPrice;
    let priceHigh = launchPrice;
    const fitModelKey = getFitModelKey(p.title);
    let isTracked = false;

    if (fitModelKey && releaseDate) {
      try {
        let sense;
        if (fitModelKey === "pixel") {
          // Fix for placeholder MSRPs in Pixel data
          if (launchPrice < 100) {
            const match = p.title.match(/Pixel (\d+)/i);
            if (match) {
              const num = match[1];
              const key = `pixel_${num}`;
              const resolved = resolveLaunchPrice(key, baseStorage);
              if (resolved) {
                launchPrice = resolved;
              }
            }
          }

          sense = sensePixel({
            releaseDate: releaseDate,
            launchPrice: launchPrice,
            storageGb: baseStorage,
            condition: "Good",
            band: 0.1,
          });
        } else {
          // Fix for iPhone MSRPs (often scraped as current price, not launch price)
          if (fitModelKey.startsWith("iphone")) {
            const key = resolveIphoneKey(p.title);
            let resolvedLaunch = null;
            if (key) {
              if (key.includes("pro_max"))
                resolvedLaunch = resolveIphoneProMaxLaunch(key, baseStorage);
              else if (key.includes("pro"))
                resolvedLaunch = resolveIphoneProLaunch(key, baseStorage);
              else resolvedLaunch = resolveIphoneBaseLaunch(key, baseStorage);
            }

            if (resolvedLaunch) {
              launchPrice = resolvedLaunch;
            }
          }

          sense = senseIphone({
            modelKey: fitModelKey,
            releaseDate: releaseDate,
            launchPrice: launchPrice,
            storageGb: baseStorage,
            condition: "Good",
            band: 0.1,
          });
        }

        // Use the estimated current value from the pricing model
        currentPrice = sense.value.priceUSD;
        priceLow = sense.value.priceLowUSD;
        priceHigh = sense.value.priceHighUSD;
        isTracked = true;
      } catch (e) {
        // Fallback or ignore error
        // console.warn(`Pricing error for ${p.title}:`, e.message);
      }
    } else {
      // If not tracked by our model, try to use a heuristic depreciation
      // This is a fallback for phones not in our strict pricing models (like OnePlus)
      // Assume 20% drop per year
      const ageYears = new Date().getFullYear() - year;
      if (ageYears > 0) {
        currentPrice = launchPrice * Math.pow(0.8, ageYears);
        priceLow = currentPrice * 0.9;
        priceHigh = currentPrice * 1.1;
      }
    }

    return {
      ...p,
      normalized: {
        year,
        price: currentPrice, // This is now the estimated current price
        priceLow,
        priceHigh,
        launchPrice,
        brand: p.specs?.manufacturer?.toLowerCase() || "",
        os: p.specs?.platform?.os?.toLowerCase() || "",
        hasTelephoto,
        screenSize,
        storage: storageOptions,
        modelName: p.specs?.model_name || p.title,
        isTracked, // We can now recommend even if not strictly "tracked" by the complex model
        fitModelKey,
      },
    };
  });

  return allPhonesCache;
};

const calculateScore = (phone, survey) => {
  let score = 100;
  const n = phone.normalized;
  const reasons = [];

  // 0. FILTER: Only recommended phones that are in the price track OR have a valid price
  // if (!n.isTracked) {
  //    return { score: 0, reasons: [] };
  // }
  if (n.price <= 0) {
    return { score: 0, reasons: [] };
  }

  // 1. LONGEVITY (Year check)
  let minYear = 2022; // Default strict
  const longevity = Array.isArray(survey.longevity)
    ? survey.longevity
    : [survey.longevity];

  if (longevity.includes("1_year")) minYear = 2018;
  else if (longevity.includes("2_3_years")) minYear = 2020;
  else if (longevity.includes("4_plus_years")) minYear = 2022;

  if (n.year < minYear) {
    return { score: 0, reasons: [] }; // Filter out directly
  }

  // 2. ECOSYSTEM
  if (survey.ecosystem && survey.ecosystem.length > 0) {
    if (survey.ecosystem.includes("apple_watch")) {
      if (n.os.includes("ios")) {
        score += 50;
        reasons.push("Perfect for Apple Watch");
      } else {
        score -= 1000; // Hard filter
      }
    }
    if (survey.ecosystem.includes("galaxy_watch")) {
      if (n.brand === "samsung") {
        score += 50;
        reasons.push("Best for Galaxy Watch");
      } else if (n.os.includes("android")) {
        score += 20;
      } else {
        score -= 1000;
      }
    }
    if (survey.ecosystem.includes("mac_ipad") && n.os.includes("ios")) {
      score += 30;
      reasons.push("Syncs with Mac/iPad");
    }
    if (survey.ecosystem.includes("windows") && n.os.includes("android")) {
      score += 15;
    }
  }

  // 3. USAGE
  if (survey.usage && survey.usage.length > 0) {
    if (survey.usage.includes("pro_photo")) {
      if (n.hasTelephoto) {
        score += 30;
        reasons.push("Has Telephoto lens");
      } else {
        score -= 20;
      }
    }
    if (survey.usage.includes("heavy_gaming")) {
      // Proxy for gaming: Newer phones (2023+) or Pro/Ultra models
      const isPro =
        n.modelName.toLowerCase().includes("pro") ||
        n.modelName.toLowerCase().includes("ultra");
      if (n.year >= 2023 && isPro) {
        score += 30;
        reasons.push("High performance for gaming");
      } else if (n.year < 2022) {
        score -= 20;
      }
    }
    if (survey.usage.includes("media")) {
      if (n.screenSize >= 6.7) {
        score += 20;
        reasons.push("Large screen for media");
      }
    }
  }

  // 4. SCREEN SIZE PREFERENCE
  if (survey.screenSize && survey.screenSize.length > 0) {
    const sizes = Array.isArray(survey.screenSize)
      ? survey.screenSize
      : [survey.screenSize];
    let fitsScreen = false;

    if (sizes.includes("compact") && n.screenSize < 6.1) fitsScreen = true;
    if (
      sizes.includes("standard") &&
      n.screenSize >= 6.1 &&
      n.screenSize <= 6.6
    )
      fitsScreen = true;
    if (sizes.includes("large") && n.screenSize > 6.6) fitsScreen = true;

    if (fitsScreen) {
      score += 20;
    } else {
      score -= 10;
    }
  }

  // 5. STORAGE
  if (survey.storage && survey.storage.length > 0) {
    const storageOpts = Array.isArray(survey.storage)
      ? survey.storage
      : [survey.storage];
    let minStorage = 256; // Default high

    if (storageOpts.includes("64")) minStorage = 64;
    else if (storageOpts.includes("128")) minStorage = 128;
    else if (storageOpts.includes("256_plus")) minStorage = 256;

    const hasStorage = n.storage.some((s) => s >= minStorage);
    if (hasStorage) score += 10;
    else score -= 50;
  }

  // 6. BUDGET
  // survey.budget is an array of strings: 'budget', 'mid', 'premium', 'flagship'
  // budget: < 250
  // mid: 250 - 500
  // premium: 500 - 800
  // flagship: 800+
  if (survey.budget && survey.budget.length > 0) {
    let fitsBudget = false;
    const price = n.price;

    for (const b of survey.budget) {
      if (b === "budget" && price <= 250) fitsBudget = true;
      if (b === "mid" && price > 250 && price <= 500) fitsBudget = true;
      if (b === "premium" && price > 500 && price <= 800) fitsBudget = true;
      if (b === "flagship" && price > 800) fitsBudget = true;
    }

    if (fitsBudget) {
      score += 40;
      reasons.push("Fits your budget");
    } else {
      // Soft penalty? Or hard filter?
      // If user selects "Under 250" and phone is 1000, it's a bad match.
      // But if phone is 260, maybe okay?
      // Let's do a hard filter for now to be safe, or a very strong penalty.
      score -= 100;
    }
  }

  // 7. BRAND PREFERENCE
  if (survey.brand) {
    const preferred = survey.brand.toLowerCase();
    if (n.brand === preferred) {
      score += 100; // Strong boost
      reasons.unshift(`Preferred brand: ${n.brand}`);
    } else {
      score -= 200; // Strong penalty for wrong brand
    }
  }

  // 8. SPECIFIC REASONS (Boost score slightly to differentiate)
  if (n.price < 300 && n.year >= 2021) {
    score += 5;
    reasons.unshift("Incredible value for money");
  }
  if (
    n.modelName.toLowerCase().includes("pro") ||
    n.modelName.toLowerCase().includes("ultra")
  ) {
    score += 5;
    reasons.unshift("Flagship performance");
  }
  if (n.hasTelephoto) {
    reasons.push("Great zoom capability");
  }

  return { score, reasons };
};

export const getRecommendationsLogic = async (survey) => {
  const phones = await loadPhones();

  const scored = phones.map((p) => {
    const { score, reasons } = calculateScore(p, survey);
    return {
      phone: {
        title: p.title,
        image: p.image,
        specs: p.specs,
        link: p.link,
        // Add other fields needed by frontend
        brand: p.normalized.brand,
        os: p.normalized.os,
        release_year: p.normalized.year,
        base_price: p.normalized.price,
        price_low: p.normalized.priceLow,
        price_high: p.normalized.priceHigh,
      },
      score,
      reasons,
    };
  });

  // Filter out bad matches
  const validMatches = scored.filter((s) => s.score > 0);

  // Sort by score descending
  validMatches.sort((a, b) => b.score - a.score);

  // DIVERSITY LOGIC: Ensure we don't just show 5 Pixels
  const topPicks = [];
  const brandsIncluded = new Set();

  // 1. Always take the absolute best match
  if (validMatches.length > 0) {
    topPicks.push(validMatches[0]);
    brandsIncluded.add(validMatches[0].phone.brand);
  }

  // 2. Try to find the best match from a DIFFERENT brand (if not explicitly requested)
  if (!survey.brand) {
    const alternativeBrandMatch = validMatches.find(
      (p) => !brandsIncluded.has(p.phone.brand)
    );
    if (alternativeBrandMatch) {
      topPicks.push(alternativeBrandMatch);
      brandsIncluded.add(alternativeBrandMatch.phone.brand);
    }
  }

  // 3. Fill the rest up to 5 with the next best phones (avoiding duplicates)
  for (const match of validMatches) {
    if (topPicks.length >= 5) break;
    if (!topPicks.includes(match)) {
      topPicks.push(match);
    }
  }

  // Sort the final top 5 by score again to show best first
  topPicks.sort((a, b) => b.score - a.score);

  // Next 5 (Alternatives) - just take the next best from the original list that aren't in topPicks
  const alternatives = validMatches
    .filter((m) => !topPicks.includes(m))
    .slice(0, 5);

  const runnerUps = validMatches
    .filter((m) => !topPicks.includes(m) && !alternatives.includes(m))
    .slice(0, 5);

  return {
    top_picks: topPicks,
    alternatives: alternatives,
    runner_ups: runnerUps,
    total_matches: validMatches.length,
  };
};

export const getAllPhones = async (req, res) => {
  try {
    const phones = await loadPhones();
    res.json({ phones });
  } catch (error) {
    console.error("Get all phones error:", error);
    res.status(500).json({ error: "Failed to fetch phones" });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const survey = req.body;
    const result = await getRecommendationsLogic(survey);
    res.json(result);
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};
