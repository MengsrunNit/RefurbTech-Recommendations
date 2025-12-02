<template>
  <div class="page price-track">
    <header class="page-header">
      <h2>Price Prediction</h2>
      <p class="page-subtitle">
        Track expected resale value over time based on model, storage, and condition.
      </p>
    </header>

    <div class="layout">
      <!-- LEFT: FILTERS -->
      <aside class="filters">
        <h3 class="filters-title">Filters</h3>

        <form class="controls" @submit.prevent="updateAll">
          <label>
            <span class="field-label">Model</span>
            <select v-model="params.model" @change="handleModelChange">
              <optgroup label="Google Pixel">
                <option
                  v-for="(info, name) in pixelModels"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </optgroup>
              <optgroup label="iPhone Base Models">
                <option
                  v-for="(info, name) in iphoneBaseModels"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </optgroup>
              <optgroup
                label="iPhone Pro Models"
                v-if="Object.keys(iphoneProModels).length"
              >
              <option
                v-for="(info, name) in iphoneProModels"
                :key="name"
                :value="name"
              >
                {{ name }}
              </option>
            </optgroup>
            <optgroup
              label="iPhone Pro Max Models"
              v-if="Object.keys(iphoneProMaxModels).length"
            >
              <option
                v-for="(info, name) in iphoneProMaxModels"
                :key="name"
                :value="name"
              >
                {{ name }}
              </option>
            </optgroup>
              <optgroup label="Samsung S Base">
                <option
                  v-for="(info, name) in samsungBaseModels"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </optgroup>
              <optgroup label="Samsung S Plus">
                <option
                  v-for="(info, name) in samsungPlusModels"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </optgroup>
              <optgroup label="Samsung S Ultra">
                <option
                  v-for="(info, name) in samsungUltraModels"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </optgroup>
              <optgroup label="iPhone Fits" v-if="phoneFits && phoneFits.length">
                <option
                  v-for="fit in phoneFits"
                  :key="fit.key"
                  :value="fit.key"
                >
                  {{ fit.name }}
                </option>
              </optgroup>
            </select>
          </label>

          <label>
            <span class="field-label">Storage</span>
            <select v-model.number="params.storage">
              <option v-for="s in storageOptions" :key="s" :value="s">
                {{ s }} GB
              </option>
            </select>
          </label>

          <label>
            <span class="field-label">Condition</span>
            <select v-model="params.condition">
              <option>Good</option>
              <option>Very Good</option>
              <option>Excellent</option>
            </select>
          </label>

          <label>
            <span class="field-label">Horizon (months)</span>
            <input
              v-model.number="params.horizon"
              type="number"
              min="0"
              max="60"
            />
          </label>

          <button type="submit" :disabled="isLoading">
            {{ isLoading ? "Updating..." : "Update" }}
          </button>
        </form>

        <p class="helper-text">
          <span v-if="activeModelType === 'pixel'">
            {{ params.model }} — launch price:
            <strong>${{ params.launch }}</strong>,
          </span>
          <span
            v-else-if="
              activeModelType === 'iphone_base_catalog' ||
              activeModelType === 'iphone_pro_catalog' ||
              activeModelType === 'iphone_pro_max_catalog'
            "
          >
            {{ params.model }} — launch price:
            <strong>${{ params.launch }}</strong>,
          </span>
          <span v-else>
            {{
              phoneFits.find((f) => f.key === params.model)?.name ||
              params.model
            }}
            — model fit,
          </span>
          storage: <strong>{{ params.storage }} GB</strong>,
          condition: <strong>{{ params.condition }}</strong>
        </p>

        <div v-if="error" class="error-banner">
          {{ error }}
        </div>

        <div class="meta meta--stacked">
          <span>Release: {{ meta.release || params.release }}</span>
          <span v-if="meta.todayAge != null">
            Age today: {{ meta.todayAge.toFixed(2) }} mo
          </span>
        </div>
      </aside>

      <!-- RIGHT: VALUE + CHART -->
      <section class="main">
        <div class="value-card">
          <div class="value">
            <div class="label">Estimated current value</div>
            <div class="price">{{ formattedPriceRange }}</div>
          </div>
          <div class="sub">
            Age today:
            <span v-if="meta.todayAge != null">
              {{ meta.todayAge.toFixed(2) }} mo
            </span>
            <span v-else>—</span>
          </div>
        </div>

        <div class="chart-wrap">
          <canvas ref="chartEl"></canvas>
        </div>

        <div class="meta meta--inline">
          <span>Release: {{ meta.release || params.release }}</span>
          <span v-if="meta.todayAge != null">
            Today age: {{ meta.todayAge.toFixed(2) }} mo
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { markRaw } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  annotationPlugin
);

// Canonical Pixel base models mapped to release date and launch MSRP by storage (USD)
const PIXEL_MODELS = {
  "Pixel 6": {
    release: "2021-10-28",
    launchByStorage: { 128: 599, 256: 699 },
  },
  "Pixel 7": {
    release: "2022-10-13",
    launchByStorage: { 128: 599, 256: 699 },
  },
  "Pixel 8": {
    release: "2023-10-12",
    launchByStorage: { 128: 699, 256: 759 },
  },
  "Pixel 9": {
    release: "2024-08-13",
    launchByStorage: { 128: 799, 256: 899 },
  },
  // Approximate values for Pixel 10; adjust as real data becomes available
  "Pixel 10": {
    release: "2025-10-10",
    launchByStorage: { 128: 799, 256: 899 },
  },
};

// iPhone base models catalog (non-Pro) with per-storage launch MSRPs and release dates
const IPHONE_BASE_MODELS = {
  "iPhone 12": {
    release: "2020-10-23",
    announced: "2020-10-13",
    launchByStorage: { 64: 799, 128: 849, 256: 949 },
    fitModelKey: "iphone_base",
  },
  "iPhone 13": {
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  "iPhone 14": {
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  "iPhone 15": {
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  "iPhone 16": {
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 128: 799, 256: 899, 512: 1099 },
    fitModelKey: "iphone_base",
  },
  "iPhone 17": {
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 799, 512: 999 },
    fitModelKey: "iphone_base",
  },
};

// iPhone Pro models catalog fallback (merged with backend when available)
const IPHONE_PRO_MODELS = {
  "iPhone 12 Pro": {
    release: "2020-10-23",
    announced: "2020-10-13",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299 },
    fitModelKey: "iphone_pro",
  },
  "iPhone 13 Pro": {
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  "iPhone 14 Pro": {
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  "iPhone 15 Pro": {
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  "iPhone 16 Pro": {
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 128: 999, 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
  "iPhone 17 Pro": {
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 1099, 512: 1299, 1024: 1499 },
    fitModelKey: "iphone_pro",
  },
};

// iPhone Pro Max models catalog fallback (merged with backend when available)
const IPHONE_PRO_MAX_MODELS = {
  "iPhone 12 Pro Max": {
    release: "2020-11-13",
    announced: "2020-10-13",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399 },
    fitModelKey: "iphone_pro_max",
  },
  "iPhone 13 Pro Max": {
    release: "2021-09-24",
    announced: "2021-09-14",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  "iPhone 14 Pro Max": {
    release: "2022-09-16",
    announced: "2022-09-07",
    launchByStorage: { 128: 1099, 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  "iPhone 15 Pro Max": {
    release: "2023-09-22",
    announced: "2023-09-12",
    launchByStorage: { 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  "iPhone 16 Pro Max": {
    release: "2024-09-20",
    announced: "2024-09-09",
    launchByStorage: { 256: 1199, 512: 1399, 1024: 1599 },
    fitModelKey: "iphone_pro_max",
  },
  "iPhone 17 Pro Max": {
    release: "2025-09-19",
    announced: "2025-09-09",
    launchByStorage: { 256: 1299, 512: 1499, 1024: 1699 },
    fitModelKey: "iphone_pro_max",
  },
};

// Samsung S Base models
const SAMSUNG_BASE_MODELS = {
  "Galaxy S22": {
    release: "2022-02-25",
    launchByStorage: { 128: 799, 256: 849 },
    fitModelKey: "samsung_base",
  },
  "Galaxy S23": {
    release: "2023-02-17",
    launchByStorage: { 128: 799, 256: 859 },
    fitModelKey: "samsung_base",
  },
  "Galaxy S24": {
    release: "2024-01-24",
    launchByStorage: { 128: 799, 256: 859 },
    fitModelKey: "samsung_base",
  },
  "Galaxy S25": {
    release: "2025-02-03",
    launchByStorage: { 128: 799, 256: 859 },
    fitModelKey: "samsung_base",
  },
};

// Samsung S Plus models
const SAMSUNG_PLUS_MODELS = {
  "Galaxy S22+": {
    release: "2022-02-25",
    launchByStorage: { 128: 999, 256: 1049 },
    fitModelKey: "samsung_plus",
  },
  "Galaxy S23+": {
    release: "2023-02-17",
    launchByStorage: { 256: 999, 512: 1119 },
    fitModelKey: "samsung_plus",
  },
  "Galaxy S24+": {
    release: "2024-01-24",
    launchByStorage: { 256: 999, 512: 1119 },
    fitModelKey: "samsung_plus",
  },
  "Galaxy S25+": {
    release: "2025-02-03",
    launchByStorage: { 256: 999, 512: 1119 },
    fitModelKey: "samsung_plus",
  },
};

// Samsung S Ultra models
const SAMSUNG_ULTRA_MODELS = {
  "Galaxy S22 Ultra": {
    release: "2022-02-25",
    launchByStorage: { 128: 1199, 256: 1299, 512: 1399, 1024: 1599 },
    fitModelKey: "samsung_ultra",
  },
  "Galaxy S23 Ultra": {
    release: "2023-02-17",
    launchByStorage: { 256: 1199, 512: 1379, 1024: 1619 },
    fitModelKey: "samsung_ultra",
  },
  "Galaxy S24 Ultra": {
    release: "2024-01-24",
    launchByStorage: { 256: 1299, 512: 1419, 1024: 1659 },
    fitModelKey: "samsung_ultra",
  },
  "Galaxy S25 Ultra": {
    release: "2025-02-03",
    launchByStorage: { 256: 1299, 512: 1419, 1024: 1659 },
    fitModelKey: "samsung_ultra",
  },
};

const DEFAULT_BAND = 0.1; // ±10%

export default {
  name: "PriceTrackPage",
  data() {
    const defaultModel = "Pixel 9";
    const defaultStorage = 128;
    const modelInfo =
      PIXEL_MODELS[defaultModel] || {
        release: "2024-08-13",
        launchByStorage: { 128: 799 },
      };
    const initialLaunch =
      (modelInfo.launchByStorage && modelInfo.launchByStorage[defaultStorage]) ||
      799;

    return {
      params: {
        model: defaultModel,
        release: modelInfo.release, // YYYY-MM-DD (derived)
        launch: initialLaunch, // USD (derived per storage)
        storage: defaultStorage,
        condition: "Excellent",
        horizon: 12, // slightly longer by default to show curvature
      },
      phoneFits: [],
      iphoneProModels: { ...IPHONE_PRO_MODELS },
      iphoneBaseModels: { ...IPHONE_BASE_MODELS },
      iphoneProMaxModels: { ...IPHONE_PRO_MAX_MODELS },
      samsungBaseModels: { ...SAMSUNG_BASE_MODELS },
      samsungPlusModels: { ...SAMSUNG_PLUS_MODELS },
      samsungUltraModels: { ...SAMSUNG_ULTRA_MODELS },
      activeModelType: "pixel", // 'pixel' or 'phone'
      meta: {},
      rawSeries: [],
      chart: null,
      todayPrice: null,
      todayRatio: null,
      todayPriceLow: null,
      todayPriceHigh: null,
      isLoading: false,
      error: null,
    };
  },

  mounted() {
    this.handleModelChange();
    this.fetchPhoneFits();
    this.fetchIphoneCatalog("base");
    this.fetchIphoneCatalog("pro");
    this.fetchIphoneCatalog("pro_max");
    this.updateAll();
  },

  methods: {
    async fetchIphoneCatalog(tier) {
      try {
        const base = this.getApiBase();
        const url = new URL("/api/iphone-models", base);
        url.searchParams.set("tier", tier);
        const { data } = await axios.get(url.toString());
        const map = {};
        if (Array.isArray(data.devices)) {
          for (const d of data.devices) {
            if (d && d.name) {
              map[d.name] = {
                release: d.release,
                announced: d.announced,
                launchByStorage: d.launchByStorage || {},
                fitModelKey:
                  d.fitModelKey ||
                  (tier === "base"
                    ? "iphone_base"
                    : tier === "pro"
                    ? "iphone_pro"
                    : "iphone_pro_max"),
              };
            }
          }
        }
        if (tier === "base") {
          this.iphoneBaseModels = { ...this.iphoneBaseModels, ...map };
        } else if (tier === "pro") {
          this.iphoneProModels = { ...this.iphoneProModels, ...map };
        } else if (tier === "pro_max") {
          this.iphoneProMaxModels = { ...this.iphoneProMaxModels, ...map };
        }
      } catch (err) {
        console.warn(`Failed to fetch iPhone ${tier} catalog`, err);
      }
    },
    resolvePixelLaunch(modelName, storageGb) {
      const info = PIXEL_MODELS[modelName];
      if (!info) return this.params.launch || 0;
      const map = info.launchByStorage || {};
      const direct = map[storageGb];
      if (direct != null) return direct;
      const sizes = Object.keys(map)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      if (!sizes.length) return this.params.launch || 0;
      // pick closest available storage price as fallback
      const closest = sizes.reduce((best, s) =>
        Math.abs(s - storageGb) < Math.abs(best - storageGb) ? s : best
      , sizes[0]);
      return (map[closest] ?? this.params.launch) ?? 0;
    },
    // Format Month YYYY label given release date (YYYY-MM-DD) and age in months (can be fractional)
    formatMonthYear(ageMonths) {
      const relStr = this.meta.release || this.params.release;
      const rel = new Date(relStr);
      if (isNaN(rel.getTime())) return String(ageMonths);
      const monthsOffset = Math.round(Number(ageMonths || 0));
      const d = new Date(rel);
      d.setMonth(d.getMonth() + monthsOffset);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    },

    handleModelChange() {
      // If selected is one of the canonical pixel models, use its release/launch
      const info = PIXEL_MODELS[this.params.model];
      if (info) {
        this.activeModelType = "pixel";
        this.params.release = info.release;
        this.params.launch = this.resolvePixelLaunch(
          this.params.model,
          this.params.storage
        );
        // Ensure storage options valid for pixel
        if (!this.storageOptions.includes(this.params.storage)) {
          this.params.storage = this.storageOptions[0];
          this.params.launch = this.resolvePixelLaunch(
            this.params.model,
            this.params.storage
          );
        }
        return;
      }

      // iPhone base catalog model selected
      const iphoneInfo = this.iphoneBaseModels[this.params.model];
      if (iphoneInfo) {
        this.activeModelType = "iphone_base_catalog";
        this.params.release = iphoneInfo.release;
        const map = iphoneInfo.launchByStorage || {};
        // adjust storage to a valid option if needed
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) <
            Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else {
          const sizes = Object.keys(map).map((s) => Number(s));
          if (sizes.length) {
            const closest = sizes.reduce((best, s) =>
              Math.abs(s - this.params.storage) <
              Math.abs(best - this.params.storage)
                ? s
                : best
            , sizes[0]);
            this.params.launch = map[closest];
          }
        }
        return;
      }

      // iPhone Pro catalog model selected
      const proInfo = this.iphoneProModels[this.params.model];
      if (proInfo) {
        this.activeModelType = "iphone_pro_catalog";
        this.params.release = proInfo.release;
        const map = proInfo.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) <
            Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) <
            Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.launch = map[closest];
        }
        return;
      }

      // iPhone Pro Max catalog model selected
      const proMaxInfo = this.iphoneProMaxModels[this.params.model];
      if (proMaxInfo) {
        this.activeModelType = "iphone_pro_max_catalog";
        this.params.release = proMaxInfo.release;
        const map = proMaxInfo.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) <
            Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) <
            Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.launch = map[closest];
        }
        return;
      }

      // Samsung Base
      const sBase = this.samsungBaseModels[this.params.model];
      if (sBase) {
        this.activeModelType = "samsung_base";
        this.params.release = sBase.release;
        const map = sBase.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.launch = map[closest];
        }
        return;
      }

      // Samsung Plus
      const sPlus = this.samsungPlusModels[this.params.model];
      if (sPlus) {
        this.activeModelType = "samsung_plus";
        this.params.release = sPlus.release;
        const map = sPlus.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.launch = map[closest];
        }
        return;
      }

      // Samsung Ultra
      const sUltra = this.samsungUltraModels[this.params.model];
      if (sUltra) {
        this.activeModelType = "samsung_ultra";
        this.params.release = sUltra.release;
        const map = sUltra.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage)
              ? s
              : best
          , allowed[0]);
          this.params.launch = map[closest];
        }
        return;
      }

      // If selected is a phone fit (from backend), mark active as phone
      const fit = this.phoneFits.find((f) => f.key === this.params.model);
      if (fit) {
        this.activeModelType = "phone";
        // don't override release/launch: user can edit release for phone fits
        return;
      }

      // Default back to pixel
      this.activeModelType = "pixel";
    },

    async fetchPhoneFits() {
      try {
        const base = this.getApiBase();
        const { data } = await axios.get(
          new URL("/api/phone-models", base).toString()
        );
        const allModels = Array.isArray(data.models) ? data.models : [];
        // Filter out the generic fit models that are now covered by specific catalogs
        const hidden = [
          "iPhone Base",
          "iPhone Pro",
          "iPhone Pro Max",
          "Samsung S Ultra",
          "Samsung S Plus",
          "Samsung S Base",
        ];
        this.phoneFits = allModels.filter((m) => !hidden.includes(m.name));
      } catch (err) {
        console.warn("Failed to fetch phone fits", err);
      }
    },

    getApiBase() {
      // Prefer same-origin to leverage Vite proxy in dev; allow override via env
      const envBase = import.meta.env?.VITE_API_BASE_URL;
      if (envBase && typeof envBase === "string" && envBase.trim().length > 0) {
        return envBase.replace(/\/$/, "");
      }
      // Prefer current origin (e.g., http://localhost:5173 in dev)
      const origin = window.location?.origin;
      if (typeof origin === "string" && /^https?:\/\//i.test(origin)) {
        return origin;
      }
      // Last resort for unusual hosts (e.g., file://)
      return "http://localhost:3000";
    },

    async fetchSense() {
      const base = this.getApiBase();
      const { release, launch, storage, condition } = this.params;

      if (
        this.activeModelType === "phone" ||
        this.activeModelType === "iphone_base_catalog" ||
        this.activeModelType === "iphone_pro_catalog" ||
        this.activeModelType === "iphone_pro_max_catalog" ||
        this.activeModelType === "samsung_base" ||
        this.activeModelType === "samsung_plus" ||
        this.activeModelType === "samsung_ultra"
      ) {
        // Use phone predictions endpoint to compute today's predicted value
        const url = new URL("/api/phone-predictions", base);
        let modelParam = this.params.model;
        if (this.activeModelType === "iphone_base_catalog") {
          modelParam = this.iphoneBaseModels[this.params.model]?.fitModelKey || "iphone_base";
        } else if (this.activeModelType === "iphone_pro_catalog") {
          modelParam = this.iphoneProModels[this.params.model]?.fitModelKey || "iphone_pro";
        } else if (this.activeModelType === "iphone_pro_max_catalog") {
          modelParam = this.iphoneProMaxModels[this.params.model]?.fitModelKey || "iphone_pro_max";
        } else if (this.activeModelType === "samsung_base") {
          modelParam = this.samsungBaseModels[this.params.model]?.fitModelKey || "samsung_base";
        } else if (this.activeModelType === "samsung_plus") {
          modelParam = this.samsungPlusModels[this.params.model]?.fitModelKey || "samsung_plus";
        } else if (this.activeModelType === "samsung_ultra") {
          modelParam = this.samsungUltraModels[this.params.model]?.fitModelKey || "samsung_ultra";
        }

        url.searchParams.set("model", modelParam);
        url.searchParams.set("release", release);
        url.searchParams.set("storage", String(storage));
        url.searchParams.set("condition", condition);
        url.searchParams.set("horizon", "0");
        url.searchParams.set("backfill", "0");
        url.searchParams.set("band", String(DEFAULT_BAND));
        // Include launch for catalog scaling if available
        if (
          (this.activeModelType === "iphone_base_catalog" ||
            this.activeModelType === "iphone_pro_catalog" ||
            this.activeModelType === "iphone_pro_max_catalog" ||
            this.activeModelType === "samsung_base" ||
            this.activeModelType === "samsung_plus" ||
            this.activeModelType === "samsung_ultra") &&
          this.params.launch
        ) {
          url.searchParams.set("launch", String(this.params.launch));
        }

        const { data } = await axios.get(url.toString());
        this.meta = data.meta || this.meta;
        // find series point closest to todayAge
        const t = Number(this.meta.todayAge ?? 0);
        const series = Array.isArray(data.series) ? data.series : [];
        let todayPt = series.reduce((best, cur) => {
          if (!best) return cur;
          return Math.abs(cur.ageMonths - t) <
            Math.abs(best.ageMonths - t)
            ? cur
            : best;
        }, null);
        if (!todayPt && series.length)
          todayPt = series[Math.floor(series.length / 2)];
        const mid = todayPt?.priceUSD ?? null;
        const low = Number(todayPt?.priceLowUSD);
        const high = Number(todayPt?.priceHighUSD);

        this.todayPrice = mid;
        this.todayPriceLow = Number.isFinite(low) ? low : mid * (1 - DEFAULT_BAND);
        this.todayPriceHigh = Number.isFinite(high)
          ? high
          : mid * (1 + DEFAULT_BAND);
        this.todayRatio = null;
        return;
      }

      // Pixel-style sense
      const url = new URL("/api/sense", base);
      url.searchParams.set("release", release);
      url.searchParams.set("launch", String(launch));
      url.searchParams.set("storage", String(storage));
      url.searchParams.set("condition", condition);
      url.searchParams.set("band", String(DEFAULT_BAND));

      const { data } = await axios.get(url.toString());

      this.meta = data.meta || this.meta;
      this.todayPrice = data.value?.priceUSD ?? null;
      this.todayRatio = data.value?.ratio ?? null;
      this.todayPriceLow = data.value?.priceLowUSD ?? null;
      this.todayPriceHigh = data.value?.priceHighUSD ?? null;
    },

    monthsSinceRelease(release) {
      const rel = new Date(release);
      if (isNaN(rel.getTime())) return 0;
      const now = new Date();

      // If model release is in the future, treat age as 0
      if (now < rel) return 0;

      const msPerDay = 86400000; // 1000 * 60 * 60 * 24
      const days = (now.getTime() - rel.getTime()) / msPerDay;
      return Math.max(0, days / 30.4375); // Average days in a month
    },

    async fetchPredictions() {
      const base = this.getApiBase();
      const { release, launch, storage, condition, horizon } = this.params;

      if (
        this.activeModelType === "phone" ||
        this.activeModelType === "iphone_base_catalog" ||
        this.activeModelType === "iphone_pro_catalog" ||
        this.activeModelType === "iphone_pro_max_catalog" ||
        this.activeModelType === "samsung_base" ||
        this.activeModelType === "samsung_plus" ||
        this.activeModelType === "samsung_ultra"
      ) {
        const url = new URL("/api/phone-predictions", base);
        let modelParam = this.params.model;
        if (this.activeModelType === "iphone_base_catalog") {
          modelParam = this.iphoneBaseModels[this.params.model]?.fitModelKey || "iphone_base";
        } else if (this.activeModelType === "iphone_pro_catalog") {
          modelParam = this.iphoneProModels[this.params.model]?.fitModelKey || "iphone_pro";
        } else if (this.activeModelType === "iphone_pro_max_catalog") {
          modelParam = this.iphoneProMaxModels[this.params.model]?.fitModelKey || "iphone_pro_max";
        } else if (this.activeModelType === "samsung_base") {
          modelParam = this.samsungBaseModels[this.params.model]?.fitModelKey || "samsung_base";
        } else if (this.activeModelType === "samsung_plus") {
          modelParam = this.samsungPlusModels[this.params.model]?.fitModelKey || "samsung_plus";
        } else if (this.activeModelType === "samsung_ultra") {
          modelParam = this.samsungUltraModels[this.params.model]?.fitModelKey || "samsung_ultra";
        }

        url.searchParams.set("model", modelParam);
        url.searchParams.set("release", release);
        url.searchParams.set("storage", String(storage));
        url.searchParams.set("condition", condition);
        url.searchParams.set("horizon", String(horizon));
        url.searchParams.set("band", String(DEFAULT_BAND));
        const backfill = Math.ceil(this.monthsSinceRelease(release));
        url.searchParams.set("backfill", String(backfill));
        if (
          (this.activeModelType === "iphone_base_catalog" ||
            this.activeModelType === "iphone_pro_catalog" ||
            this.activeModelType === "iphone_pro_max_catalog" ||
            this.activeModelType === "samsung_base" ||
            this.activeModelType === "samsung_plus" ||
            this.activeModelType === "samsung_ultra") &&
          this.params.launch
        ) {
          url.searchParams.set("launch", String(this.params.launch));
        }

        const { data } = await axios.get(url.toString());
        this.meta = data.meta || {};
        this.rawSeries = Array.isArray(data.series) ? data.series : [];
        // Fallback: if sense step didn’t set today value, derive it from series
        if (
          (this.todayPrice == null || isNaN(this.todayPrice)) &&
          this.rawSeries.length
        ) {
          const t = Number(this.meta.todayAge ?? 0);
          let todayPt = this.rawSeries.reduce((best, cur) => {
            if (!best) return cur;
            return Math.abs(cur.ageMonths - t) <
              Math.abs(best.ageMonths - t)
              ? cur
              : best;
          }, null);
          if (!todayPt && this.rawSeries.length)
            todayPt = this.rawSeries[Math.floor(this.rawSeries.length / 2)];
          const mid = todayPt?.priceUSD ?? null;
          const low = Number(todayPt?.priceLowUSD);
          const high = Number(todayPt?.priceHighUSD);

          this.todayPrice = mid;
          this.todayPriceLow = Number.isFinite(low)
            ? low
            : mid * (1 - DEFAULT_BAND);
          this.todayPriceHigh = Number.isFinite(high)
            ? high
            : mid * (1 + DEFAULT_BAND);
        }
        return;
      }

      const url = new URL("/api/predictions", base);
      url.searchParams.set("release", release);
      url.searchParams.set("launch", String(launch));
      url.searchParams.set("storage", String(storage));
      url.searchParams.set("condition", condition);
      url.searchParams.set("horizon", String(horizon));
      url.searchParams.set("band", String(DEFAULT_BAND));

      // backfill to cover full history from release to today
      const backfill = Math.ceil(this.monthsSinceRelease(release));
      url.searchParams.set("backfill", String(backfill));

      const { data } = await axios.get(url.toString());
      this.meta = data.meta || {};
      this.rawSeries = Array.isArray(data.series) ? data.series : [];
      if (
        (this.todayPrice == null || isNaN(this.todayPrice)) &&
        this.rawSeries.length
      ) {
        const t = Number(this.meta.todayAge ?? 0);
        let todayPt = this.rawSeries.reduce((best, cur) => {
          if (!best) return cur;
          return Math.abs(cur.ageMonths - t) <
            Math.abs(best.ageMonths - t)
            ? cur
            : best;
        }, null);
        if (!todayPt && this.rawSeries.length)
          todayPt = this.rawSeries[Math.floor(this.rawSeries.length / 2)];
        const mid = todayPt?.priceUSD ?? null;
        const low = Number(todayPt?.priceLowUSD);
        const high = Number(todayPt?.priceHighUSD);

        this.todayPrice = mid;
        this.todayPriceLow = Number.isFinite(low) ? low : mid * (1 - DEFAULT_BAND);
        this.todayPriceHigh = Number.isFinite(high)
          ? high
          : mid * (1 + DEFAULT_BAND);
      }
    },

    buildDatasets() {
      const t = Number(this.meta.todayAge ?? 0);
      const past = [];
      const future = [];
      const lowBand = [];
      const highBand = [];

      for (const p of this.rawSeries) {
        const x = p.ageMonths;
        const midPt = { x, y: p.priceUSD };
        const lowPt = { x, y: p.priceLowUSD ?? p.priceUSD };
        const highPt = { x, y: p.priceHighUSD ?? p.priceUSD };

        lowBand.push(lowPt);
        highBand.push(highPt);

        if (x <= t) past.push(midPt);
        if (x >= t) future.push(midPt);
      }

      return [
        // Band: draw low first, then high filled to previous to create shaded area
        {
          label: "Range Low",
          data: lowBand,
          borderColor: "rgba(37,99,235,0)",
          backgroundColor: "rgba(37,99,235,0)",
          borderWidth: 0,
          pointRadius: 0,
          fill: false,
          order: 0,
        },
        {
          label: "Range High",
          data: highBand,
          borderColor: "rgba(37,99,235,0)",
          backgroundColor: "rgba(37,99,235,0.12)",
          borderWidth: 0,
          pointRadius: 0,
          fill: "-1",
          order: 1,
        },
        {
          label: "Past",
          data: past,
          borderColor: "#6b7280",
          backgroundColor: "#6b7280",
          borderWidth: 2,
          pointRadius: 3, // show past as points + line
          pointHoverRadius: 4,
          tension: 0.2,
          order: 2,
        },
        {
          label: "Forecast",
          data: future,
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          borderWidth: 3,
          pointRadius: 0, // forecast as smooth line only
          borderDash: [5, 5], // dashed to distinguish forecast
          tension: 0.2,
          order: 3,
        },
      ];
    },

    buildOrUpdateChart() {
      if (!this.$refs.chartEl) return;
      const ctx = this.$refs.chartEl.getContext("2d");
      const datasets = this.buildDatasets();
      const todayAge = Number(this.meta.todayAge ?? 0);
      const xMax =
        Math.max(todayAge, Number(this.params.horizon || 0) + todayAge) || 12;

      const formatTick = (v) => this.formatMonthYear(v);
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: "Resale price vs calendar month since release",
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (items) => {
                const x = items?.[0]?.parsed?.x;
                if (x == null) return "";
                return formatTick(x);
              },
            },
          },
          annotation: {
            annotations: {
              todayLine: {
                type: "line",
                xMin: todayAge,
                xMax: todayAge,
                borderColor: "#ef4444",
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  content: "Today",
                  enabled: true,
                  position: "start",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  yAdjust: -10,
                },
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Month since release" },
            min: 0,
            max: xMax,
            ticks: {
              callback: (value) => formatTick(value),
              autoSkip: true,
              maxRotation: 0,
            },
          },
          y: {
            title: { display: true, text: "Price (USD)" },
            beginAtZero: true,
          },
        },
      };

      if (this.chart) {
        this.chart.data.datasets = datasets;
        this.chart.options = options;
        this.chart.update();
      } else {
        this.chart = markRaw(
          new Chart(ctx, {
            type: "line",
            data: { datasets },
            options,
          })
        );
      }
    },

    async updateChart() {
      await this.fetchPredictions();
      this.buildOrUpdateChart();
    },

    async updateAll() {
      this.error = null;
      this.isLoading = true;
      try {
        await this.fetchSense();
        await this.updateChart();
      } catch (e) {
        console.error("Failed to update", e);
        const serverMsg = e?.response?.data?.error;
        const msg =
          serverMsg ||
          e?.message ||
          "Failed to load predictions. Please try again.";
        this.error = msg;
      } finally {
        this.isLoading = false;
      }
    },
  },

  computed: {
    pixelModels() {
      return PIXEL_MODELS;
    },
    storageOptions() {
      if (this.activeModelType === "pixel") return [128, 256, 512];
      if (this.activeModelType === "iphone_base_catalog") {
        const m = this.iphoneBaseModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256, 512];
      }
      if (this.activeModelType === "iphone_pro_catalog") {
        const m = this.iphoneProModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256, 512, 1024];
      }
      if (this.activeModelType === "iphone_pro_max_catalog") {
        const m = this.iphoneProMaxModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256, 512, 1024];
      }
      if (this.activeModelType === "samsung_base") {
        const m = this.samsungBaseModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256];
      }
      if (this.activeModelType === "samsung_plus") {
        const m = this.samsungPlusModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [256, 512];
      }
      if (this.activeModelType === "samsung_ultra") {
        const m = this.samsungUltraModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [256, 512, 1024];
      }
      return [128, 256, 512];
    },
    formattedPriceRange() {
      const lo = this.todayPriceLow ?? this.todayPrice;
      const hi = this.todayPriceHigh ?? this.todayPrice;
      if (lo == null || hi == null) return "—";
      const fmt = (v) => `$${Number(v).toFixed(2)}`;
      return lo === hi ? fmt(lo) : `${fmt(lo)} - ${fmt(hi)}`;
    },
  },

  watch: {
    "params.storage"(nv) {
      if (this.activeModelType === "pixel") {
        this.params.launch = this.resolvePixelLaunch(this.params.model, nv);
      } else if (this.activeModelType === "iphone_base_catalog") {
        const info = this.iphoneBaseModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === "iphone_pro_catalog") {
        const info = this.iphoneProModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === "iphone_pro_max_catalog") {
        const info = this.iphoneProMaxModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === "samsung_base") {
        const info = this.samsungBaseModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === "samsung_plus") {
        const info = this.samsungPlusModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === "samsung_ultra") {
        const info = this.samsungUltraModels[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best
              , sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      }
    },
  },

  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
};
</script>

<style scoped>
.price-track {
  max-width: 1150px;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 3vw, 2.5rem) 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  background: linear-gradient(135deg, #eef2ff 0%, #fef3c7 100%);
  border-radius: 30px;
  position: relative;
  box-shadow: 0 25px 70px rgba(15, 23, 42, 0.15);
  overflow: hidden;
}

.price-track::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 15% 20%,
    rgba(255, 255, 255, 0.45),
    transparent 40%
  );
  pointer-events: none;
}

.page-header {
  position: relative;
  z-index: 1;
}

.page-header h2 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: #475569;
}

.layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1.75rem;
  align-items: flex-start;
}

/* LEFT PANEL (FILTERS) */

.filters {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  padding: 1.25rem 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(6px);
}

.filters-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.35rem;
  letter-spacing: 0.01em;
}

.controls {
  display: grid;
  gap: 0.85rem;
}

.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.field-label {
  color: #475569;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.controls input,
.controls select {
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 10px;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.95);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.controls input:focus,
.controls select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.controls button {
  margin-top: 0.35rem;
  padding: 0.65rem 1rem;
  border: none;
  background: linear-gradient(120deg, #4f46e5, #7c3aed);
  color: #fff;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: background 0.2s ease, transform 0.05s ease,
    box-shadow 0.2s ease;
}

.controls button:not(:disabled):hover {
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.controls button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
  transform: none;
}

.helper-text {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.4;
}

.error-banner {
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #b91c1c;
  font-size: 0.82rem;
}

.meta {
  color: #475569;
  font-size: 0.78rem;
}

.meta--stacked {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

/* RIGHT PANEL (MAIN CONTENT) */

.main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.value-card {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 18px;
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #fff;
  box-shadow: 0 18px 35px rgba(14, 165, 233, 0.35);
  position: relative;
  overflow: hidden;
}

.value .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.04em;
}

.value .price {
  font-weight: 700;
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  color: #fff;
}

.value-card .sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
}

/* Chart area */

.chart-wrap {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 35px rgba(15, 23, 42, 0.08);
  height: 360px;
}

.chart-wrap canvas {
  width: 100% !important;
  height: 100% !important;
}

.meta--inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  color: #475569;
  font-size: 0.82rem;
}

/* Responsiveness */

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .filters {
    order: 2;
  }

  .main {
    order: 1;
  }
}
</style>
