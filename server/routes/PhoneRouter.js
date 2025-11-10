import express from "express";
const router = express.Router();

import PhoneController from "../controllers/phoneController.js";

// Prediction coefficients and intercept
const coefficients = {
  Age_at_Sale: -0.009292,
  Storage_num: -0.000085,
  Year_of_Sale: 0.050774,
  Month_of_Sale: 0.002336,
  Condition_Excellent: 0.024017,
  Condition_Good: -0.020838,
  Condition_Very_Good: -0.003179,
};
const intercept = -102.0269053445481;

// Prediction endpoint
router.post("/predict-price", (req, res) => {
  const { Age_at_Sale, Storage_num, Year_of_Sale, Month_of_Sale, Condition } = req.body;

  // Map condition to coefficients
  const conditionCoefficients = {
    Excellent: coefficients.Condition_Excellent,
    Good: coefficients.Condition_Good,
    "Very Good": coefficients.Condition_Very_Good,
  };

  // Calculate predicted price
  const predictedPrice =
    intercept +
    coefficients.Age_at_Sale * Age_at_Sale +
    coefficients.Storage_num * Storage_num +
    coefficients.Year_of_Sale * Year_of_Sale +
    coefficients.Month_of_Sale * Month_of_Sale +
    (conditionCoefficients[Condition] || 0);

  res.json({ predictedPrice });
});

router.get("/phones", PhoneController.getPhones);

export default router;
