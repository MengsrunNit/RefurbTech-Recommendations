// controllers/phoneController.js
import { getPhones, getScore } from "../models/phoneModel.js";
import { getPredictionSeries, parseNumber, MODELS } from "../models/iphonePricingModel.js";

const PhoneController = {
  async getPhones(req, res, next) {
    try {
      const { brand = "all" } = req.query;
      const data = await getPhones();

      let phones = [];
      if (brand === "all") {
        phones = [
          ...data.apple,
          ...data.samsung,
          ...data.google,
        ].sort((a, b) => getScore(b) - getScore(a));
      } else if (data[brand]) {
        phones = data[brand];
      } else {
        return res.status(400).json({ error: "Invalid brand" });
      }

      res.json({ phones }); // <-- matches the frontend expectation
    } catch (err) {
      next(err);
    }
  },

  predictPrice(req, res) {
    const { Age_at_Sale, Storage_num, Year_of_Sale, Month_of_Sale, Condition } = req.body;

    // Fallback simple calculation using the iphone_base coefficients (for backward compatibility)
    try {
      const model = MODELS.iphone_base;
      const c = model.coefficients;
      const conditionCoefficients = {
        Excellent: c.Condition_Excellent,
        Good: c.Condition_Good,
        "Very Good": c.Condition_Very_Good,
      };

      const predictedPrice =
        model.intercept +
        (c.Age_at_Sale || 0) * (Age_at_Sale || 0) +
        (c.Storage_num || 0) * (Storage_num || 0) +
        (c.Year_of_Sale || 0) * (Year_of_Sale || 0) +
        (c.Month_of_Sale || 0) * (Month_of_Sale || 0) +
        (conditionCoefficients[Condition] || 0);

      res.json({ predictedPrice });
    } catch (err) {
      res.status(500).json({ error: "Predict price failed" });
    }
  },

  getPhonePredictions(req, res) {
    try {
      const { model: modelKey, release, storage, condition, horizon: horizonQ, backfill: backfillQ, band: bandQ, launch: launchQ } = req.query;

      if (!modelKey) {
        return res.status(400).json({ error: "Missing required query param: model" });
      }

      if (!release) {
        return res.status(400).json({ error: "Missing required query param: release (YYYY-MM-DD)" });
      }

      const relDate = new Date(release);
      if (isNaN(relDate.getTime())) {
        return res.status(400).json({ error: "Invalid release date format. Use YYYY-MM-DD" });
      }

      const storageGb = parseInt(storage, 10) || 0;
      const horizon = parseNumber(horizonQ, 24);
      const backfill = parseNumber(backfillQ, 6);
      const band = parseNumber(bandQ, 0.1);

      // Optional launch scaling (treat regression output as ratio * launchPrice when provided)
      const launchPriceParsed = parseNumber(launchQ, NaN);
      const launchPrice = Number.isFinite(launchPriceParsed) && launchPriceParsed > 0 ? launchPriceParsed : undefined;

      const result = getPredictionSeries({
        modelKey,
        releaseDate: relDate,
        storageGb,
        condition: typeof condition === "string" ? condition : "Excellent",
        horizon,
        backfill,
        band,
        launchPrice,
      });

      if (launchPrice != null) {
        result.meta.launchPrice = launchPrice;
      }

      res.json(result);
    } catch (err) {
      console.error("/api/phone-predictions error", err);
      res.status(500).json({ error: "Internal error computing phone predictions" });
    }
  },
};

export default PhoneController;
