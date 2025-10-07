import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(express.json());

// Resolve file path to iphone data JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iphoneDataPath = path.join(
  __dirname,
  "phone_data",
  "iphone_gsmarena_phones.json"
);
const samsungDataPath = path.join(
  __dirname,
  "phone_data",
  "samsung_major_series_phones.json"
);
const googleDataPath = path.join(
  __dirname,
  "phone_data",
  "google_pixel_phones.json"
);
const oneplusDataPath = path.join(
  __dirname,
  "phone_data",
  "oneplus_phones.json"
);

// Simple endpoint to return iPhone list
app.get("/api/iphones", async (_req, res) => {
  try {
    const raw = await readFile(iphoneDataPath, "utf-8");
    const data = JSON.parse(raw);
    res.json({ phones: data });
  } catch (err) {
    console.error("Failed to load iphone data:", err);
    res.status(500).json({ error: "Could not load iphone data" });
  }
});

// Combined endpoint with optional brand filter: all | apple | samsung
app.get("/api/phones", async (req, res) => {
  try {
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
    const google = JSON.parse(googleRaw).map((p) => ({
      ...p,
      brand: "google",
    }));
    const oneplus = JSON.parse(oneplusRaw).map((p) => ({
      ...p,
      brand: "oneplus",
    }));

    const brand = String(req.query.brand || "all").toLowerCase();
    let list = [];
    if (brand === "apple") list = apple;
    else if (brand === "samsung") list = samsung;
    else if (brand === "google") list = google;
    else if (brand === "oneplus") list = oneplus;
    else list = [...apple, ...samsung, ...google, ...oneplus];

    // Latest first: use page_number if available, fallback to heuristic on link id number
    const getScore = (p) => {
      if (typeof p.page_number === "number") return p.page_number;
      const m = /-(\d+)\.php$/.exec(p.link || "");
      return m ? Number(m[1]) : 0;
    };
    list.sort((a, b) => getScore(b) - getScore(a));

    // If brand=all, interleave top items from each brand to create a mixed feed
    if (brand === "all") {
      const a = apple.sort((x, y) => getScore(y) - getScore(x));
      const s = samsung.sort((x, y) => getScore(y) - getScore(x));
      const g = google.sort((x, y) => getScore(y) - getScore(x));
      const o = oneplus.sort((x, y) => getScore(y) - getScore(x));
      const mixed = [];
      const max = Math.max(a.length, s.length, g.length, o.length);
      for (let i = 0; i < max; i++) {
        if (a[i]) mixed.push(a[i]);
        if (s[i]) mixed.push(s[i]);
        if (g[i]) mixed.push(g[i]);
        if (o[i]) mixed.push(o[i]);
      }
      list = mixed;
    }

    res.json({ phones: list });
  } catch (err) {
    console.error("Failed to load phones:", err);
    res.status(500).json({ error: "Could not load phones" });
  }
});

// Simple endpoint to return OnePlus list
app.get("/api/oneplus", async (_req, res) => {
  try {
    const raw = await readFile(oneplusDataPath, "utf-8");
    const data = JSON.parse(raw);
    res.json({ phones: data.map((p) => ({ ...p, brand: "oneplus" })) });
  } catch (err) {
    console.error("Failed to load oneplus data:", err);
    res.status(500).json({ error: "Could not load oneplus data" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
