<template>
  <div class="page survey">
    <div class="container">
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
        <p class="progress-text">Step {{ currentStep }} of {{ totalSteps }}</p>
      </div>

      <div class="step-container">
        <transition name="slide" mode="out-in">
          <div v-if="currentStep === 1" key="step1" class="step">
            <h2>💰 What's your budget?</h2>
            <p>
              Select all price ranges you are comfortable with (Fair Condition)
            </p>

            <div class="list-options">
              <div
                v-for="option in budgetOptions"
                :key="option.value"
                class="list-item"
                :class="{ active: survey.budget.includes(option.value) }"
                @click="toggleSelection('budget', option.value)"
              >
                <div class="icon">{{ option.icon }}</div>
                <div class="content">
                  <h4>{{ option.label }}</h4>
                  <p>{{ option.description }}</p>
                </div>
                <div class="check"></div>
              </div>
            </div>
            <div class="selected-count">
              {{
                survey.budget.length > 0
                  ? `${survey.budget.length} ranges selected`
                  : "Select at least 1"
              }}
            </div>
          </div>

          <div v-else-if="currentStep === 2" key="step2" class="step">
            <h2>🔗 What tech do you already own?</h2>
            <p>Select all that apply (This helps us match the OS)</p>

            <div class="list-options">
              <div
                v-for="item in ecosystemOptions"
                :key="item.value"
                class="list-item"
                :class="{ active: survey.ecosystem.includes(item.value) }"
                @click="toggleSelection('ecosystem', item.value)"
              >
                <div class="icon">{{ item.icon }}</div>
                <div class="content">
                  <h4>{{ item.label }}</h4>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 3" key="step3" class="step">
            <h2>📱 How will you use this phone?</h2>
            <p>Select your main activities (Pick at least 1)</p>

            <div class="list-options">
              <div
                v-for="use in usageOptions"
                :key="use.value"
                class="list-item"
                :class="{ active: survey.usage.includes(use.value) }"
                @click="toggleSelection('usage', use.value)"
              >
                <div class="icon">{{ use.icon }}</div>
                <div class="content">
                  <h4>{{ use.label }}</h4>
                  <p>{{ use.description }}</p>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 4" key="step4" class="step">
            <h2>📐 Screen size preference?</h2>
            <p>What size feels comfortable for you? (Select at least 1)</p>

            <div class="list-options">
              <div
                v-for="screen in screenOptions"
                :key="screen.value"
                class="list-item"
                :class="{ active: survey.screenSize.includes(screen.value) }"
                @click="toggleSelection('screenSize', screen.value)"
              >
                <div class="icon">
                  {{
                    screen.size === "small"
                      ? "📱"
                      : screen.size === "medium"
                      ? "📲"
                      : "📟"
                  }}
                </div>
                <div class="content">
                  <h4>{{ screen.label }}</h4>
                  <p>{{ screen.description }}</p>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 5" key="step5" class="step">
            <h2>💾 Storage needs?</h2>
            <p>
              Refurbished phones usually can't upgrade storage later (Select at
              least 1)
            </p>

            <div class="list-options">
              <div
                v-for="storage in storageOptions"
                :key="storage.value"
                class="list-item"
                :class="{ active: survey.storage.includes(storage.value) }"
                @click="toggleSelection('storage', storage.value)"
              >
                <div class="icon">{{ storage.icon }}</div>
                <div class="content">
                  <h4>{{ storage.label }}</h4>
                  <p>{{ storage.description }}</p>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 6" key="step6" class="step">
            <h2>📅 How long do you plan to keep this phone?</h2>
            <p>
              Older phones are cheaper but stop getting updates sooner (Select
              at least 1)
            </p>

            <div class="list-options">
              <div
                v-for="opt in longevityOptions"
                :key="opt.value"
                class="list-item"
                :class="{ active: survey.longevity.includes(opt.value) }"
                @click="toggleSelection('longevity', opt.value)"
              >
                <div class="content">
                  <h4>{{ opt.label }}</h4>
                  <p>{{ opt.description }}</p>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="currentStep === 7"
            key="step7"
            class="step results-step"
          >
            <div v-if="loading" class="loading-state">
              <div class="loader"></div>
              <h3>Finding your perfect matches...</h3>
              <p>Checking ecosystem compatibility and feature lists...</p>
            </div>

            <div
              v-else-if="recommendations.top_picks.length > 0"
              class="results"
            >
              <h2>🎉 Your Perfect Phone Matches!</h2>
              <p>Based on your ecosystem and needs:</p>

              <!-- Top Picks -->
              <h3 class="section-title">🏆 Top Picks</h3>
              <div class="recommendations-grid">
                <div
                  v-for="(rec, index) in recommendations.top_picks"
                  :key="rec.phone.link"
                  class="recommendation-card"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <div class="match-badge">{{ rec.score }}% match</div>
                  <div class="phone-image">
                    <img
                      v-if="rec.phone.image"
                      :src="rec.phone.image"
                      alt="Phone"
                      style="max-width: 100px; border-radius: 8px"
                    />
                    <div v-else class="img-placeholder">📱</div>
                  </div>
                  <div class="phone-info">
                    <h4>{{ rec.phone.title }}</h4>
                    <div class="price-range" v-if="rec.phone.price_low">
                      Est. Price: ${{ Math.round(rec.phone.price_low) }} - ${{
                        Math.round(rec.phone.price_high)
                      }}
                    </div>
                    <div class="reasons">
                      <h5>Why this fits:</h5>
                      <ul>
                        <li v-for="reason in rec.reasons" :key="reason">
                          {{ reason }}
                        </li>
                      </ul>
                    </div>
                    <div class="action-buttons">
                      <button class="view-specs-btn">Select Condition</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alternatives -->
              <div v-if="recommendations.alternatives.length > 0">
                <h3 class="section-title">✨ Great Alternatives</h3>
                <div class="recommendations-grid">
                  <div
                    v-for="(rec, index) in recommendations.alternatives"
                    :key="rec.phone.link"
                    class="recommendation-card"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <div class="match-badge">{{ rec.score }}% match</div>
                    <div class="phone-image">
                      <img
                        v-if="rec.phone.image"
                        :src="rec.phone.image"
                        alt="Phone"
                        style="max-width: 100px; border-radius: 8px"
                      />
                      <div v-else class="img-placeholder">📱</div>
                    </div>
                    <div class="phone-info">
                      <h4>{{ rec.phone.title }}</h4>
                      <div class="price-range" v-if="rec.phone.price_low">
                        Est. Price: ${{ Math.round(rec.phone.price_low) }} - ${{
                          Math.round(rec.phone.price_high)
                        }}
                      </div>
                      <div class="reasons">
                        <h5>Why this fits:</h5>
                        <ul>
                          <li v-for="reason in rec.reasons" :key="reason">
                            {{ reason }}
                          </li>
                        </ul>
                      </div>
                      <div class="action-buttons">
                        <button class="view-specs-btn">Select Condition</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Runner Ups -->
              <div v-if="recommendations.runner_ups.length > 0">
                <h3 class="section-title">👍 Worth Considering</h3>
                <div class="recommendations-grid">
                  <div
                    v-for="(rec, index) in recommendations.runner_ups"
                    :key="rec.phone.link"
                    class="recommendation-card"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <div class="match-badge">{{ rec.score }}% match</div>
                    <div class="phone-image">
                      <img
                        v-if="rec.phone.image"
                        :src="rec.phone.image"
                        alt="Phone"
                        style="max-width: 100px; border-radius: 8px"
                      />
                      <div v-else class="img-placeholder">📱</div>
                    </div>
                    <div class="phone-info">
                      <h4>{{ rec.phone.title }}</h4>
                      <div class="price-range" v-if="rec.phone.price_low">
                        Est. Price: ${{ Math.round(rec.phone.price_low) }} - ${{
                          Math.round(rec.phone.price_high)
                        }}
                      </div>
                      <div class="reasons">
                        <h5>Why this fits:</h5>
                        <ul>
                          <li v-for="reason in rec.reasons" :key="reason">
                            {{ reason }}
                          </li>
                        </ul>
                      </div>
                      <div class="action-buttons">
                        <button class="view-specs-btn">Select Condition</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="survey-actions">
                <button @click="resetSurvey" class="secondary-btn">
                  Start Over
                </button>
              </div>
            </div>
            <div v-else class="results">
              <h2>No perfect matches found 😕</h2>
              <p>
                Try selecting a wider budget range or fewer specific
                requirements.
              </p>
              <button @click="resetSurvey" class="primary-btn">
                Start Over
              </button>
            </div>
          </div>
        </transition>
      </div>

      <div class="navigation" v-if="currentStep < 7">
        <button
          @click="previousStep"
          :disabled="currentStep === 1"
          class="nav-btn secondary"
        >
          ← Previous
        </button>

        <button
          @click="nextStep"
          :disabled="!canProceed"
          class="nav-btn primary"
        >
          {{ currentStep === 6 ? "Find My Phone!" : "Next →" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import axios from "axios";

const currentStep = ref(1);
const totalSteps = 7;

const survey = reactive({
  budget: [],
  ecosystem: [],
  usage: [],
  screenSize: [],
  storage: [],
  longevity: [],
});

// --- DATA OPTIONS ---

const budgetOptions = [
  {
    value: "budget",
    label: "Under $250",
    description: "Great value, older flagships",
    icon: "🏷️",
  },
  {
    value: "mid",
    label: "$250 - $500",
    description: "Modern features, great bang-for-buck",
    icon: "⚖️",
  },
  {
    value: "premium",
    label: "$500 - $800",
    description: "Recent pro models & flagships",
    icon: "💎",
  },
  {
    value: "flagship",
    label: "$800+",
    description: "The absolute latest & greatest",
    icon: "🚀",
  },
];

const ecosystemOptions = [
  { value: "apple_watch", label: "Apple Watch", icon: "⌚" },
  { value: "mac_ipad", label: "MacBook / iPad", icon: "💻" },
  { value: "galaxy_watch", label: "Galaxy Watch", icon: "⌚" },
  { value: "galaxy_buds", label: "Galaxy Buds", icon: "🎧" },
  { value: "windows", label: "Windows PC", icon: "🖥️" },
  { value: "none", label: "None / Starting Fresh", icon: "✨" },
];

const usageOptions = [
  {
    value: "social_media",
    label: "Social & Browsing",
    description: "Instagram, TikTok, Web",
    icon: "💬",
  },
  {
    value: "pro_photo",
    label: "Pro Photography",
    description: "Zoom, Night Mode, RAW",
    icon: "📸",
  },
  {
    value: "casual_photo",
    label: "Casual Snaps",
    description: "Memories & Selfies",
    icon: "🤳",
  },
  {
    value: "heavy_gaming",
    label: "Heavy Gaming",
    description: "Genshin, CoD, Emulation",
    icon: "🎮",
  },
  {
    value: "light_gaming",
    label: "Light Gaming",
    description: "Puzzles, Candy Crush",
    icon: "🎲",
  },
  {
    value: "media",
    label: "Streaming Movies",
    description: "Netflix, YouTube",
    icon: "🍿",
  },
];

const screenOptions = [
  {
    value: "compact",
    label: 'Compact (Under 6.1")',
    description: "Easy one-handed use",
    size: "small",
  },
  {
    value: "standard",
    label: 'Standard (6.1" - 6.6")',
    description: "Great balance",
    size: "medium",
  },
  {
    value: "large",
    label: 'Large (6.7"+)',
    description: "Max screen for media",
    size: "large",
  },
];

const storageOptions = [
  {
    value: "64",
    label: "64GB (Basic)",
    description: "I stream everything",
    icon: "☁️",
  },
  {
    value: "128",
    label: "128GB (Standard)",
    description: "Good for most users",
    icon: "📦",
  },
  {
    value: "256_plus",
    label: "256GB+ (Power User)",
    description: "Lots of games/videos",
    icon: "🗄️",
  },
];

const longevityOptions = [
  {
    value: "1_year",
    label: "1 Year (Temporary)",
    description: "I need something cheap now",
  },
  { value: "2_3_years", label: "2-3 Years", description: "Standard usage" },
  {
    value: "4_plus_years",
    label: "4+ Years",
    description: "Max software updates",
  },
];

// Computed property to determine if the user can proceed to the next step
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return survey.budget.length > 0;
    case 2:
      return survey.ecosystem.length > 0;
    case 3:
      return survey.usage.length > 0;
    case 4:
      return survey.screenSize.length > 0;
    case 5:
      return survey.storage.length > 0;
    case 6:
      return survey.longevity.length > 0;
    default:
      return true;
  }
});

// Generalized toggle for arrays
function toggleSelection(field, value) {
  const index = survey[field].indexOf(value);

  // Logic for 'none' in Ecosystem
  if (field === "ecosystem" && value === "none") {
    survey.ecosystem = ["none"];
    return;
  }

  if (index > -1) {
    survey[field].splice(index, 1);
  } else {
    // Clear 'none' if selecting something else in ecosystem
    if (field === "ecosystem" && survey.ecosystem.includes("none")) {
      survey.ecosystem = [];
    }
    survey[field].push(value);
  }
}

// Navigation functions
function nextStep() {
  if (canProceed.value) {
    if (currentStep.value === 6) generateRecommendations();
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

// Survey reset function
const loading = ref(false);
const recommendations = ref({
  top_picks: [],
  alternatives: [],
  runner_ups: [],
});

// Updated State
function resetSurvey() {
  Object.assign(survey, {
    budget: [],
    ecosystem: [],
    usage: [],
    screenSize: [],
    storage: [],
    longevity: [],
  });
  currentStep.value = 1;
  recommendations.value = { top_picks: [], alternatives: [], runner_ups: [] };
}

function getApiBase() {
  const envBase = import.meta.env?.VITE_API_BASE_URL;
  if (envBase && typeof envBase === "string" && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, "");
  }
  const origin = window.location?.origin;
  if (typeof origin === "string" && /^https?:\/\//i.test(origin)) {
    return origin;
  }
  return "http://localhost:3000";
}

async function generateRecommendations() {
  loading.value = true;

  try {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/api/recommendations`, survey);

    recommendations.value = {
      top_picks: data.top_picks || [],
      alternatives: data.alternatives || [],
      runner_ups: data.runner_ups || [],
    };
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.survey {
  padding: 2rem 0;
  min-height: 100vh;
}
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Unified List for Options */
.list-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 600px;
  margin: 0 auto;
}

.list-item {
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.list-item:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: var(--brand-2);
  transform: translateX(4px);
}

.list-item.active {
  background: rgba(34, 211, 238, 0.1);
  border-color: var(--brand-1);
}

.list-item .icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  min-width: 40px;
  text-align: center;
}

.list-item .content {
  flex: 1;
}

.list-item h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
  font-weight: 600;
}

.list-item p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.list-item .check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--muted);
  margin-left: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.list-item.active .check {
  background: var(--brand-1);
  border-color: var(--brand-1);
  color: white;
}

.list-item.active .check::after {
  content: "✓";
  font-size: 0.8rem;
  font-weight: bold;
}

/* Typography & Layout */
.step h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}
.step > p {
  color: var(--muted);
  font-size: 1rem;
  margin-bottom: 2rem;
}
.selected-count {
  margin-top: 1.5rem;
  color: var(--brand-1);
  font-weight: 600;
  font-size: 0.9rem;
}

/* Progress Bar */
.progress-container {
  margin-bottom: 2rem;
  text-align: center;
}
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  border-radius: 20px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-text {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Mockups */
.phone-mockup {
  margin: 0 auto 1rem;
  border: 2px solid var(--muted);
  border-radius: 12px;
  position: relative;
  background: rgba(51, 65, 85, 0.5);
}
.phone-mockup.small {
  width: 40px;
  height: 70px;
}
.phone-mockup.medium {
  width: 50px;
  height: 85px;
}
.phone-mockup.large {
  width: 60px;
  height: 100px;
}
.screen {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  background: linear-gradient(135deg, var(--brand-2), var(--brand-1));
  border-radius: 8px;
  opacity: 0.8;
}

/* Navigation */
.navigation {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}
.nav-btn {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  min-width: 120px;
  font-size: 0.95rem;
  transition: transform 0.2s;
}
.nav-btn.primary {
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  color: white;
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
}
.nav-btn.secondary {
  background: rgba(51, 65, 85, 0.5);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.nav-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Results */
.results-step {
  width: 100%;
}
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.recommendation-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  animation: slideInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  text-align: left;
  backdrop-filter: blur(10px);
}
.match-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--brand-1);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.phone-image {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 3rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
}

.section-title {
  font-size: 1.5rem;
  margin: 2rem 0 1rem;
  color: var(--text);
  font-weight: 700;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.price-range {
  font-size: 0.9rem;
  color: var(--brand-2);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
