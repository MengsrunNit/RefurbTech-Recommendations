// controllers/phoneController.js
import { getPhones, getScore } from "../models/phoneModel.js";

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
          ...data.oneplus,
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
};

export default PhoneController;
