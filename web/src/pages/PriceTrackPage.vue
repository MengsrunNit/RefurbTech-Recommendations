<template>
  <div class="page price-track">
    <h2>Price Prediction</h2>

    <form class="controls" @submit.prevent="updateAll">
      <label>
        Model
        <select v-model="params.model" @change="handleModelChange">
          <option value="Pixel 6">Pixel 6</option>
          <option value="Pixel 7">Pixel 7</option>
          <option value="Pixel 8">Pixel 8</option>
          <option value="Pixel 9">Pixel 9</option>
          <option value="Pixel 10">Pixel 10</option>
        </select>
      </label>

      <label>
        Storage
        <select v-model.number="params.storage">
          <option :value="128">128</option>
          <option :value="256">256</option>
          <option :value="512">512</option>
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
      {{ params.model }} — launch price:
      <strong>${{ params.launch }}</strong>,
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

// Canonical Pixel base models mapped to release date and base launch MSRP (USD)
const PIXEL_MODELS = {
  "Pixel 6": { release: "2021-10-28", launch: 599 },
  "Pixel 7": { release: "2022-10-13", launch: 599 },
  "Pixel 8": { release: "2023-10-12", launch: 699 },
  "Pixel 9": { release: "2024-08-13", launch: 799 },
  // Approximate values for Pixel 10; adjust as real data becomes available
  "Pixel 10": { release: "2025-10-10", launch: 799 },
};

const DEFAULT_BAND = 0.1; // ±10%

export default {
  data() {
    const defaultModel = "Pixel 9";
    const modelInfo =
      PIXEL_MODELS[defaultModel] || { release: "2024-08-13", launch: 799 };

    return {
      params: {
        model: defaultModel,
        release: modelInfo.release, // YYYY-MM-DD (derived)
        launch: modelInfo.launch, // USD (derived)
        storage: 128,
        condition: "Excellent",
        horizon: 24,
      },
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
    this.updateAll();
  },

  methods: {
    handleModelChange() {
      const info = PIXEL_MODELS[this.params.model];
      if (info) {
        this.params.release = info.release;
        this.params.launch = info.launch;
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
      const msPerDay = 86400000;
      const days = (now - rel) / msPerDay;
      return Math.max(0, days / 30.44);
    },

    async fetchPredictions() {
      const base = this.getApiBase();
      const { release, launch, storage, condition, horizon } = this.params;

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
          pointRadius: 0,
          tension: 0.2,
          order: 2,
        },
        {
          label: "Forecast",
          data: future,
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          borderWidth: 3,
          pointRadius: 0,
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

      const options = {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: "Resale price vs months since release",
          },
          tooltip: { mode: "index", intersect: false },
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
            title: { display: true, text: "Months since release" },
            min: 0,
            max: xMax,
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
        const msg = serverMsg || e?.message || "Failed to load predictions. Please try again.";
        this.error = msg;
      } finally {
        this.isLoading = false;
      }
    },
  },

  computed: {
    formattedPriceRange() {
      const lo = this.todayPriceLow ?? this.todayPrice;
      const hi = this.todayPriceHigh ?? this.todayPrice;
      if (lo == null || hi == null) return "—";
      const fmt = (v) => `$${Number(v).toFixed(2)}`;
      return lo === hi ? fmt(lo) : `${fmt(lo)} - ${fmt(hi)}`;
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
