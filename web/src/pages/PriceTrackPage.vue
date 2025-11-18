<template>
  <div class="page price-track">
    <h2>Price Prediction</h2>

    <form class="controls" @submit.prevent="updateAll">
      <label>
        Model
        <select v-model="params.model" @change="handleModelChange">
          <optgroup label="Google Pixel">
            <option v-for="(info, name) in pixelModels" :key="name" :value="name">{{ name }}</option>
          </optgroup>
                  <optgroup label="iPhone Base Models">
                    <option v-for="(info, name) in iphoneBaseModels" :key="name" :value="name">{{ name }}</option>
                  </optgroup>
          <optgroup label="iPhone Pro Models" v-if="Object.keys(iphoneProModels).length">
            <option v-for="(info, name) in iphoneProModels" :key="name" :value="name">{{ name }}</option>
          </optgroup>
          <optgroup label="iPhone Fits" v-if="phoneFits && phoneFits.length">
            <option v-for="fit in phoneFits" :key="fit.key" :value="fit.key">{{ fit.name }}</option>
          </optgroup>
        </select>
      </label>

      <label>
        Storage
        <select v-model.number="params.storage">
          <option v-for="s in storageOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>

      <label>
        Condition
        <select v-model="params.condition">
          <option>Good</option>
          <option>Very Good</option>
          <option>Excellent</option>
        </select>
      </label>

      <label>
        Horizon (mo)
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
        {{ params.model }} — launch price: <strong>${{ params.launch }}</strong>,
      </span>
      <span v-else-if="activeModelType === 'iphone_base_catalog' || activeModelType === 'iphone_pro_catalog'">
        {{ params.model }} — launch price: <strong>${{ params.launch }}</strong>,
      </span>
      <span v-else>
        {{ phoneFits.find(f => f.key === params.model)?.name || params.model }} — model fit,
      </span>
      storage: <strong>{{ params.storage }} GB</strong>,
      condition: <strong>{{ params.condition }}</strong>
    </p>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

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
      <canvas ref="chartEl" width="720" height="360"></canvas>
    </div>

    <div class="meta">
      <span>Release: {{ meta.release || params.release }}</span>
      <span v-if="meta.todayAge != null">
        Today age: {{ meta.todayAge.toFixed(2) }} mo
      </span>
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

const DEFAULT_BAND = 0.1; // ±10%

export default {
  name: "PriceTrackPage",
  data() {
    const defaultModel = "Pixel 9";
    const defaultStorage = 128;
    const modelInfo =
      PIXEL_MODELS[defaultModel] || { release: "2024-08-13", launchByStorage: { 128: 799 } };
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
    this.fetchIphoneProCatalog();
    this.updateAll();
  },

  methods: {
    async fetchIphoneProCatalog() {
      try {
        const base = this.getApiBase();
        const { data } = await axios.get(new URL('/api/iphone-pro-models', base).toString());
        const map = {};
        if (Array.isArray(data.devices)) {
          for (const d of data.devices) {
            if (d && d.name) {
              map[d.name] = {
                release: d.release,
                announced: d.announced,
                launchByStorage: d.launchByStorage || {},
                fitModelKey: d.fitModelKey || 'iphone_pro',
              };
            }
          }
        }
        this.iphoneProModels = { ...this.iphoneProModels, ...map };
      } catch (err) {
        console.warn('Failed to fetch iPhone Pro catalog', err);
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
        Math.abs(s - storageGb) < Math.abs(best - storageGb) ? s : best,
      sizes[0]);
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
        this.params.launch = this.resolvePixelLaunch(this.params.model, this.params.storage);
        // Ensure storage options valid for pixel
        if (!this.storageOptions.includes(this.params.storage)) {
          this.params.storage = this.storageOptions[0];
          this.params.launch = this.resolvePixelLaunch(this.params.model, this.params.storage);
        }
        return;
      }

      // iPhone base catalog model selected
      const iphoneInfo = IPHONE_BASE_MODELS[this.params.model];
      if (iphoneInfo) {
        this.activeModelType = "iphone_base_catalog";
        this.params.release = iphoneInfo.release;
        const map = iphoneInfo.launchByStorage || {};
        // adjust storage to a valid option if needed
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage) ? s : best,
          allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else {
          const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage) ? s : best,
              sizes[0]);
              this.params.launch = map[closest];
            }
        }
        return;
      }

      // iPhone Pro catalog model selected
      const proInfo = this.iphoneProModels[this.params.model];
      if (proInfo) {
        this.activeModelType = 'iphone_pro_catalog';
        this.params.release = proInfo.release;
        const map = proInfo.launchByStorage || {};
        const allowed = Object.keys(map).map((s) => Number(s));
        if (allowed.length && !allowed.includes(this.params.storage)) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage) ? s : best,
          allowed[0]);
          this.params.storage = closest;
        }
        const direct = map[this.params.storage];
        if (direct != null) {
          this.params.launch = direct;
        } else if (allowed.length) {
          const closest = allowed.reduce((best, s) =>
            Math.abs(s - this.params.storage) < Math.abs(best - this.params.storage) ? s : best,
          allowed[0]);
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
        const { data } = await axios.get(new URL("/api/phone-models", base).toString());
        this.phoneFits = Array.isArray(data.models) ? data.models : [];
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

      if (this.activeModelType === "phone" || this.activeModelType === 'iphone_base_catalog' || this.activeModelType === 'iphone_pro_catalog') {
        // Use phone predictions endpoint to compute today's predicted value
        const url = new URL("/api/phone-predictions", base);
        const modelParam = this.activeModelType === 'iphone_base_catalog'
          ? (IPHONE_BASE_MODELS[this.params.model]?.fitModelKey || 'iphone_base')
          : this.activeModelType === 'iphone_pro_catalog'
            ? (this.iphoneProModels[this.params.model]?.fitModelKey || 'iphone_pro')
            : this.params.model;
        url.searchParams.set("model", modelParam);
        url.searchParams.set("release", release);
        url.searchParams.set("storage", String(storage));
        url.searchParams.set("condition", condition);
        url.searchParams.set("horizon", "0");
        url.searchParams.set("backfill", "0");
        url.searchParams.set("band", String(DEFAULT_BAND));
        // Include launch for catalog scaling if available
        if ((this.activeModelType === 'iphone_base_catalog' || this.activeModelType === 'iphone_pro_catalog') && this.params.launch) {
          url.searchParams.set('launch', String(this.params.launch));
        }

        const { data } = await axios.get(url.toString());
        this.meta = data.meta || this.meta;
        // find series point closest to todayAge
        const t = Number(this.meta.todayAge ?? 0);
        const series = Array.isArray(data.series) ? data.series : [];
        let todayPt = series.reduce((best, cur) => {
          if (!best) return cur;
          return Math.abs(cur.ageMonths - t) < Math.abs(best.ageMonths - t) ? cur : best;
        }, null);
        if (!todayPt && series.length) todayPt = series[Math.floor(series.length / 2)];
        this.todayPrice = todayPt?.priceUSD ?? null;
        
        const mid = todayPt?.priceUSD ?? null;
        const low = Number(todayPt?.priceLowUSD);
        const high = Number(todayPt?.priceHighUSD);

        this.todayPrice = mid;
        this.todayPriceLow = Number.isFinite(low) ? low : mid * (1 - DEFAULT_BAND);
        this.todayPriceHigh = Number.isFinite(high) ? high : mid * (1 + DEFAULT_BAND);
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

      if (this.activeModelType === "phone" || this.activeModelType === 'iphone_base_catalog' || this.activeModelType === 'iphone_pro_catalog') {
        const url = new URL("/api/phone-predictions", base);
        const modelParam = this.activeModelType === 'iphone_base_catalog'
          ? (IPHONE_BASE_MODELS[this.params.model]?.fitModelKey || 'iphone_base')
          : this.activeModelType === 'iphone_pro_catalog'
            ? (this.iphoneProModels[this.params.model]?.fitModelKey || 'iphone_pro')
            : this.params.model;
        url.searchParams.set("model", modelParam);
        url.searchParams.set("release", release);
        url.searchParams.set("storage", String(storage));
        url.searchParams.set("condition", condition);
        url.searchParams.set("horizon", String(horizon));
        url.searchParams.set("band", String(DEFAULT_BAND));
        const backfill = Math.ceil(this.monthsSinceRelease(release));
        url.searchParams.set("backfill", String(backfill));
        if ((this.activeModelType === 'iphone_base_catalog' || this.activeModelType === 'iphone_pro_catalog') && this.params.launch) {
          url.searchParams.set('launch', String(this.params.launch));
        }

        const { data } = await axios.get(url.toString());
        this.meta = data.meta || {};
        this.rawSeries = Array.isArray(data.series) ? data.series : [];
        // Fallback: if sense step didn’t set today value, derive it from series
        if ((this.todayPrice == null || isNaN(this.todayPrice)) && this.rawSeries.length) {
          const t = Number(this.meta.todayAge ?? 0);
          let todayPt = this.rawSeries.reduce((best, cur) => {
            if (!best) return cur;
            return Math.abs(cur.ageMonths - t) < Math.abs(best.ageMonths - t) ? cur : best;
          }, null);
          if (!todayPt && this.rawSeries.length) todayPt = this.rawSeries[Math.floor(this.rawSeries.length / 2)];
          const mid = todayPt?.priceUSD ?? null;
          const low = Number(todayPt?.priceLowUSD);
          const high = Number(todayPt?.priceHighUSD);

          this.todayPrice = mid;
          this.todayPriceLow = Number.isFinite(low) ? low : mid * (1 - DEFAULT_BAND);
          this.todayPriceHigh = Number.isFinite(high) ? high : mid * (1 + DEFAULT_BAND);

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
      if ((this.todayPrice == null || isNaN(this.todayPrice)) && this.rawSeries.length) {
        const t = Number(this.meta.todayAge ?? 0);
        let todayPt = this.rawSeries.reduce((best, cur) => {
          if (!best) return cur;
          return Math.abs(cur.ageMonths - t) < Math.abs(best.ageMonths - t) ? cur : best;
        }, null);
        if (!todayPt && this.rawSeries.length) todayPt = this.rawSeries[Math.floor(this.rawSeries.length / 2)];
        const mid = todayPt?.priceUSD ?? null;
        const low = Number(todayPt?.priceLowUSD);
        const high = Number(todayPt?.priceHighUSD);

        this.todayPrice = mid;
        this.todayPriceLow = Number.isFinite(low) ? low : mid * (1 - DEFAULT_BAND);
        this.todayPriceHigh = Number.isFinite(high) ? high : mid * (1 + DEFAULT_BAND);
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
          pointRadius: 3,       // show past as points + line
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
          pointRadius: 0,       // forecast as smooth line only
          borderDash: [5, 5],   // dashed to distinguish forecast
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
        responsive: false,
        maintainAspectRatio: true,
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
      // Expose PIXEL_MODELS to the template as a simple object (key -> info)
      return PIXEL_MODELS;
    },
    iphoneBaseModels() {
      return IPHONE_BASE_MODELS;
    },
    storageOptions() {
      if (this.activeModelType === 'pixel') return [128, 256, 512];
      if (this.activeModelType === 'iphone_base_catalog') {
        const m = IPHONE_BASE_MODELS[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256, 512];
      }
      if (this.activeModelType === 'iphone_pro_catalog') {
        const m = this.iphoneProModels[this.params.model];
        const arr = Object.keys(m?.launchByStorage || {}).map((s) => Number(s));
        return arr.length ? arr : [128, 256, 512, 1024];
      }
      return [128, 256, 512];
    },
    formattedPriceRange() {
      const lo = this.todayPriceLow ?? this.todayPrice;
      const hi = this.todayPriceHigh ?? this.todayPrice;
      console.log("hello");
      console.log(this.todayPriceLow, this.todayPriceHigh, this.todayPrice);
      console.log(lo)
      if (lo == null || hi == null) return "—";
      const fmt = (v) => `$${Number(v).toFixed(2)}`;
      return lo === hi ? fmt(lo) : `${fmt(lo)} - ${fmt(hi)}`;
    },
  },

  watch: {
    'params.storage'(nv) {
      if (this.activeModelType === 'pixel') {
        this.params.launch = this.resolvePixelLaunch(this.params.model, nv);
      } else if (this.activeModelType === 'iphone_base_catalog') {
        const info = IPHONE_BASE_MODELS[this.params.model];
        if (info) {
          const map = info.launchByStorage || {};
          const direct = map[nv];
          if (direct != null) {
            this.params.launch = direct;
          } else {
            const sizes = Object.keys(map).map((s) => Number(s));
            if (sizes.length) {
              const closest = sizes.reduce((best, s) =>
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best,
              sizes[0]);
              this.params.launch = map[closest];
            }
          }
        }
      } else if (this.activeModelType === 'iphone_pro_catalog') {
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
                Math.abs(s - nv) < Math.abs(best - nv) ? s : best,
              sizes[0]);
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
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
  align-items: end;
}

.controls label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.controls input,
.controls select {
  padding: 0.4rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.controls button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.controls button:disabled {
  opacity: 0.7;
  cursor: default;
}

.helper-text {
  font-size: 0.9rem;
  color: #4b5563;
}

.error-banner {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.9rem;
}

.chart-wrap {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
}

.value-card {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px;
}

.value .label {
  font-size: 0.85rem;
  color: #6b7280;
}

.value .price {
  font-weight: 700;
  font-size: 1.6rem;
}

.value-card .sub {
  color: #6b7280;
}

.meta {
  color: #6b7280;
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
}
</style>
