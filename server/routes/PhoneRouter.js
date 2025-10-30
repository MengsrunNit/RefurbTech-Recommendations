import express from "express";
const router = express.Router();

import PhoneController from "../controllers/phoneController.js";

router.get("/phones", PhoneController.getPhones);

export default router;
