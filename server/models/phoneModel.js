// models/phoneModel.js
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../phone_data");

const iphoneDataPath = path.join(dataDir, "iphone_gsmarena_phones.json");
const samsungDataPath = path.join(dataDir, "samsung_major_series_phones.json");
const googleDataPath = path.join(dataDir, "google_pixel_phones.json");
const oneplusDataPath = path.join(dataDir, "oneplus_phones.json");

// Helper to score items
const getScore = (p) => {
  if (typeof p.page_number === "number") return p.page_number;
  const m = /-(\d+)\.php$/.exec(p.link || "");
  return m ? Number(m[1]) : 0;
};

export async function getPhones() {
  const [appleRaw, samsungRaw, googleRaw, oneplusRaw] = await Promise.all([
    readFile(iphoneDataPath, "utf-8"),
    readFile(samsungDataPath, "utf-8"),
    readFile(googleDataPath, "utf-8"),
    readFile(oneplusDataPath, "utf-8"),
  ]);

  const apple = JSON.parse(appleRaw).map((p) => ({ ...p, brand: "apple" }));
  const samsung = JSON.parse(samsungRaw).map((p) => ({
    ...p,
    brand: "samsung",
  }));
  const google = JSON.parse(googleRaw).map((p) => ({ ...p, brand: "google" }));
  const oneplus = JSON.parse(oneplusRaw).map((p) => ({
    ...p,
    brand: "oneplus",
  }));

  const sortByScoreDesc = (a, b) => getScore(b) - getScore(a);

  return {
    apple: apple.sort(sortByScoreDesc),
    samsung: samsung.sort(sortByScoreDesc),
    google: google.sort(sortByScoreDesc),
    oneplus: oneplus.sort(sortByScoreDesc),
  };
}

export { getScore };
