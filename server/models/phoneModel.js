// models/phoneModel.js
import { getDb } from "../utils/database.js";

// Helper to score items
export const getScore = (p) => {
  if (typeof p.page_number === "number") return p.page_number;

  const match = /-(\d+)\.php$/.exec(p.link || "");
  return match ? Number(match[1]) : 0;
};

export async function getPhones() {
  const db = await getDb();
  const phonesCollection = db.collection("phones");

  // Get ALL phones from MongoDB
  const phones = await phonesCollection.find({}).toArray();

  const sortByScoreDesc = (a, b) => getScore(b) - getScore(a);

  // Group into categories based on the `brand` you assigned
  const brands = {
    apple: [],
    samsung: [],
    google: [],
    oneplus: [],
  };

  for (const phone of phones) {
    if (brands[phone.brand]) {
      brands[phone.brand].push(phone);
    }
  }

  // Sort each brand’s list
  for (const brandName of Object.keys(brands)) {
    brands[brandName] = brands[brandName].sort(sortByScoreDesc);
  }

  return brands;
}
