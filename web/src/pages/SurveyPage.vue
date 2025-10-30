<template>
  <div class="page survey">
    <div class="container">
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
        <p class="progress-text">Step {{ currentStep }} of {{ totalSteps }}</p>
      </div>

      <!-- Step Content -->
      <div class="step-container">
        <transition name="slide" mode="out-in">
          <!-- Step 1: Budget -->
          <div v-if="currentStep === 1" key="step1" class="step">
            <h2>💰 What's your budget?</h2>
            <p>Let's start with your price range for a refurbished phone</p>

            <div class="budget-options">
              <div
                v-for="option in budgetOptions"
                :key="option.value"
                class="budget-card"
                :class="{ active: survey.budget === option.value }"
                @click="survey.budget = option.value"
              >
                <div class="budget-icon">{{ option.icon }}</div>
                <h4>{{ option.label }}</h4>
                <p>{{ option.description }}</p>
              </div>
            </div>
          </div>

          <!-- Step 2: Priorities -->
          <div v-else-if="currentStep === 2" key="step2" class="step">
            <h2>👤 Who are you as a phone user?</h2>
            <p>
              Pick at least 2 that describe you (choose as many as you like)
            </p>

            <div class="priorities-grid">
              <div
                v-for="priority in priorities"
                :key="priority.value"
                class="priority-card"
                :class="{
                  active: survey.priorities.includes(priority.value),
                }"
                @click="togglePriority(priority.value)"
              >
                <div class="priority-icon">{{ priority.icon }}</div>
                <h4>{{ priority.label }}</h4>
                <p>{{ priority.description }}</p>
              </div>
            </div>

            <div
              class="selected-count"
              :class="{ error: survey.priorities.length < 2 }"
            >
              <template v-if="survey.priorities.length >= 2">
                {{ survey.priorities.length }} selected
              </template>
              <template v-else> Select at least 2 to continue </template>
            </div>
          </div>

          <!-- Step 3: Usage -->
          <div v-else-if="currentStep === 3" key="step3" class="step">
            <h2>📱 How do you use your phone?</h2>
            <p>This helps us recommend the right specs for you</p>

            <div class="usage-options">
              <div
                v-for="use in usageOptions"
                :key="use.value"
                class="usage-card"
                :class="{ active: survey.primaryUse === use.value }"
                @click="survey.primaryUse = use.value"
              >
                <div class="usage-icon">{{ use.icon }}</div>
                <h4>{{ use.label }}</h4>
                <p>{{ use.description }}</p>
              </div>
            </div>
          </div>

          <!-- Step 4: Battery -->
          <div v-else-if="currentStep === 4" key="step4" class="step">
            <h2>⏱️ How much do you use your phone daily?</h2>
            <p>Pick your average screen-on time per day</p>

            <div class="battery-options">
              <div
                v-for="battery in batteryOptions"
                :key="battery.value"
                class="battery-card"
                :class="{ active: survey.batteryImportance === battery.value }"
                @click="survey.batteryImportance = battery.value"
              >
                <div class="battery-level">
                  <div class="battery-icon" :class="battery.level">
                    <div
                      class="battery-fill"
                      :style="{ width: battery.fillWidth }"
                    ></div>
                  </div>
                </div>
                <h4>{{ battery.label }}</h4>
                <p>{{ battery.description }}</p>
              </div>
            </div>
          </div>

          <!-- Step 5: OS Preference -->
          <div v-else-if="currentStep === 5" key="step5" class="step">
            <h2>⚙️ Operating System?</h2>
            <p>Do you have a preference between iOS and Android?</p>

            <div class="os-options">
              <div
                v-for="os in osOptions"
                :key="os.value"
                class="os-card"
                :class="{ active: survey.osPreference === os.value }"
                @click="survey.osPreference = os.value"
              >
                <div class="os-icon">{{ os.icon }}</div>
                <h4>{{ os.label }}</h4>
                <p>{{ os.description }}</p>
              </div>
            </div>
          </div>

          <!-- Step 6: Screen Size -->
          <div v-else-if="currentStep === 6" key="step6" class="step">
            <h2>📐 Screen size preference?</h2>
            <p>What size feels comfortable for you?</p>

            <div class="screen-options">
              <div
                v-for="screen in screenOptions"
                :key="screen.value"
                class="screen-card"
                :class="{ active: survey.screenSize === screen.value }"
                @click="survey.screenSize = screen.value"
              >
                <div class="phone-mockup" :class="screen.size">
                  <div class="screen"></div>
                </div>
                <h4>{{ screen.label }}</h4>
                <p>{{ screen.description }}</p>
              </div>
            </div>
          </div>

          <!-- Step 7: Storage -->
          <div v-else-if="currentStep === 7" key="step7" class="step">
            <h2>💾 Storage needs?</h2>
            <p>How much space do you need for apps, photos, and files?</p>

            <div class="storage-options">
              <div
                v-for="storage in storageOptions"
                :key="storage.value"
                class="storage-card"
                :class="{ active: survey.storage === storage.value }"
                @click="survey.storage = storage.value"
              >
                <div class="storage-icon">{{ storage.icon }}</div>
                <h4>{{ storage.label }}</h4>
                <p>{{ storage.description }}</p>
                <div class="storage-examples">{{ storage.examples }}</div>
              </div>
            </div>
          </div>

          <!-- Step 8: Results -->
          <div
            v-else-if="currentStep === 8"
            key="step8"
            class="step results-step"
          >
            <div v-if="loading" class="loading-state">
              <div class="loader"></div>
              <h3>Finding your perfect matches...</h3>
              <p>Analyzing thousands of phones to find the best ones for you</p>
            </div>

            <div v-else-if="recommendations.length > 0" class="results">
              <h2>🎉 Your Perfect Phone Matches!</h2>
              <p>
                Based on your preferences, here are our top recommendations:
              </p>

              <div class="recommendations-grid">
                <div
                  v-for="(rec, index) in recommendations"
                  :key="rec.phone.link"
                  class="recommendation-card"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <div class="match-badge">{{ rec.score }}% match</div>
                  <div class="phone-image">
                    <img :src="rec.phone.image" :alt="rec.phone.title" />
                  </div>
                  <div class="phone-info">
                    <h4>{{ rec.phone.title }}</h4>
                    <div class="reasons">
                      <h5>Perfect for you because:</h5>
                      <ul>
                        <li v-for="reason in rec.reasons" :key="reason">
                          {{ reason }}
                        </li>
                      </ul>
                    </div>
                    <div class="action-buttons">
                      <button
                        @click="$router.push('/phone')"
                        class="view-specs-btn"
                      >
                        View Details
                      </button>
                      <button class="compare-btn">Add to Compare</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="survey-actions">
                <button @click="resetSurvey" class="secondary-btn">
                  Take Survey Again
                </button>
                <button
                  @click="$router.push('/comparison')"
                  class="primary-btn"
                >
                  Compare All
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Navigation -->
      <div class="navigation" v-if="currentStep < 8">
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
          {{ currentStep === 7 ? "Find My Phone!" : "Next →" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

const currentStep = ref(1);
const totalSteps = 7;
const loading = ref(false);
const recommendations = ref([]);

const survey = reactive({
  budget: "",
  priorities: [], // now stores personas, we'll derive feature priorities
  primaryUse: "",
  batteryImportance: "",
  osPreference: "",
  screenSize: "",
  storage: "",
});

// Options data
const budgetOptions = [
  {
    value: "under-300",
    label: "Under $300",
    description: "Budget-friendly options",
    icon: "💵",
  },
  {
    value: "300-600",
    label: "$300 - $600",
    description: "Great value picks",
    icon: "💰",
  },
  {
    value: "above-600",
    label: "Above $600",
    description: "Premium and flagship",
    icon: "👑",
  },
];

const priorities = [
  {
    value: "student",
    label: "Student",
    description: "Budget, battery, online classes",
    icon: "🎒",
  },
  {
    value: "business",
    label: "Business",
    description: "Email, docs, reliability",
    icon: "�",
  },
  {
    value: "creator",
    label: "Content Creator",
    description: "Camera, storage, performance",
    icon: "🎥",
  },
  {
    value: "gamer",
    label: "Gamer",
    description: "High performance, cooling",
    icon: "🎮",
  },
  {
    value: "senior",
    label: "Senior",
    description: "Easy to use, clear display",
    icon: "🧓",
  },
  {
    value: "traveler",
    label: "Traveler",
    description: "Battery, durability, dual-SIM",
    icon: "✈️",
  },
  {
    value: "fashion",
    label: "Style-focused",
    description: "Design, premium feel",
    icon: "✨",
  },
  {
    value: "value",
    label: "Value Seeker",
    description: "Best features for price",
    icon: "�",
  },
];

const usageOptions = [
  {
    value: "social-media",
    label: "Social Media",
    description: "Instagram, TikTok, messaging",
    icon: "💬",
  },
  {
    value: "photography",
    label: "Photography",
    description: "Taking lots of photos/videos",
    icon: "📷",
  },
  {
    value: "gaming",
    label: "Gaming",
    description: "Mobile games & entertainment",
    icon: "🎮",
  },
  {
    value: "work",
    label: "Work",
    description: "Productivity & business",
    icon: "💼",
  },
  {
    value: "streaming",
    label: "Streaming",
    description: "Videos, music, content",
    icon: "📺",
  },
  {
    value: "basic",
    label: "Basic Use",
    description: "Calls, texts, simple apps",
    icon: "📞",
  },
];

const batteryOptions = [
  {
    value: "1-2h",
    label: "1–2 hours/day",
    description: "Light use: calls, chat, a bit of browsing",
    level: "low",
    fillWidth: "25%",
  },
  {
    value: "3-5h",
    label: "3–5 hours/day",
    description: "Moderate use: social, maps, music",
    level: "medium",
    fillWidth: "50%",
  },
  {
    value: "5-7h",
    label: "5–7 hours/day",
    description: "Heavy use: video, games, multitasking",
    level: "high",
    fillWidth: "75%",
  },
  {
    value: "7h-plus",
    label: "7+ hours/day",
    description: "Very heavy use: power users & on-the-go",
    level: "full",
    fillWidth: "100%",
  },
];

const osOptions = [
  {
    value: "ios",
    label: "iOS",
    description: "iPhone experience",
    icon: "🍎",
  },
  {
    value: "android",
    label: "Android",
    description: "Google ecosystem",
    icon: "🤖",
  },
  {
    value: "either",
    label: "Either",
    description: "I'm flexible",
    icon: "🤝",
  },
];

const screenOptions = [
  {
    value: "compact",
    label: "Compact",
    description: 'Under 6" - Easy one-handed use',
    size: "small",
  },
  {
    value: "standard",
    label: "Standard",
    description: '6" - 6.5" - Perfect balance',
    size: "medium",
  },
  {
    value: "large",
    label: "Large",
    description: 'Over 6.5" - Big screen experience',
    size: "large",
  },
];

const storageOptions = [
  {
    value: "basic",
    label: "64-128GB",
    description: "Essential apps & photos",
    examples: "~1,000 photos, basic apps",
    icon: "📦",
  },
  {
    value: "moderate",
    label: "256GB",
    description: "Plenty of room",
    examples: "~5,000 photos, many apps",
    icon: "📫",
  },
  {
    value: "high",
    label: "512GB+",
    description: "Never worry about space",
    examples: "~10,000+ photos, unlimited apps",
    icon: "🗄️",
  },
];

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!survey.budget;
    case 2:
      return survey.priorities.length >= 2;
    case 3:
      return !!survey.primaryUse;
    case 4:
      return !!survey.batteryImportance;
    case 5:
      return !!survey.osPreference;
    case 6:
      return !!survey.screenSize;
    case 7:
      return !!survey.storage;
    default:
      return true;
  }
});

// Methods
function togglePriority(value) {
  const index = survey.priorities.indexOf(value);
  if (index > -1) {
    survey.priorities.splice(index, 1);
  } else {
    survey.priorities.push(value);
  }
}

function nextStep() {
  if (canProceed.value) {
    if (currentStep.value === 7) {
      generateRecommendations();
    }
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

async function generateRecommendations() {
  loading.value = true;

  // Simulate loading time for better UX
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Try to fetch from your backend API first
    let allPhones = [];
    try {
      const res = await fetch("http://localhost:3000/api/phones");
      const data = await res.json();
      allPhones = data.phones || [];
    } catch (error) {
      console.log("Backend not available, using local data");
      // Fallback to local data
      const localData = await import("../data/phones.json");
      allPhones = localData.default || [];
    }

    // Filter and score phones based on survey responses
    const scoredPhones = allPhones
      .map((phone) => ({
        phone,
        score: calculateMatchScore(phone, survey),
        reasons: generateReasons(phone, survey),
      }))
      .filter((item) => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    recommendations.value = scoredPhones;
  } catch (error) {
    console.error("Failed to generate recommendations:", error);
  } finally {
    loading.value = false;
  }
}

function resetSurvey() {
  Object.assign(survey, {
    budget: "",
    priorities: [],
    primaryUse: "",
    batteryImportance: "",
    osPreference: "",
    screenSize: "",
    storage: "",
  });
  currentStep.value = 1;
  recommendations.value = [];
}

// Keep the existing scoring functions
function calculateMatchScore(phone, survey) {
  let score = 0;
  const weights = { budget: 25, os: 20, priorities: 30, usage: 15, specs: 10 };

  score += getBudgetScore(phone, survey.budget) * (weights.budget / 100);
  score += getOSScore(phone, survey.osPreference) * (weights.os / 100);
  const derived = deriveFeaturePrioritiesFromPersonas(survey.priorities);
  score += getPriorityScore(phone, derived) * (weights.priorities / 100);
  score += getUsageScore(phone, survey) * (weights.usage / 100);
  score += getSpecsScore(phone, survey) * (weights.specs / 100);

  return Math.round(score);
}

// Convert personas into feature priorities to reuse scoring logic
function deriveFeaturePrioritiesFromPersonas(personas) {
  const map = {
    student: ["battery", "price", "performance"],
    business: ["performance", "battery", "security"],
    creator: ["camera", "storage", "performance", "screen"],
    gamer: ["performance", "battery", "screen"],
    senior: ["screen", "battery", "simplicity"],
    traveler: ["battery", "durability", "dual-sim"],
    fashion: ["design", "screen"],
    value: ["price", "battery"],
  };
  const features = new Set();
  personas.forEach((p) => (map[p] || []).forEach((f) => features.add(f)));
  return Array.from(features);
}

function getBudgetScore(phone, budget) {
  const budgetRanges = {
    "under-300": [0, 300],
    "300-600": [300, 600],
    "above-600": [600, Infinity],
  };

  const brandPriceMap = { apple: 800, samsung: 600, google: 500, oneplus: 400 };
  const phoneTitle = phone.title?.toLowerCase() || "";
  let estimatedPrice = 500;

  if (phoneTitle.includes("iphone")) estimatedPrice = brandPriceMap.apple;
  else if (phoneTitle.includes("samsung"))
    estimatedPrice = brandPriceMap.samsung;
  else if (phoneTitle.includes("google") || phoneTitle.includes("pixel"))
    estimatedPrice = brandPriceMap.google;
  else if (phoneTitle.includes("oneplus"))
    estimatedPrice = brandPriceMap.oneplus;

  const range = budgetRanges[budget];
  return range && estimatedPrice >= range[0] && estimatedPrice <= range[1]
    ? 100
    : 50;
}

function getOSScore(phone, osPreference) {
  if (osPreference === "either") return 100;
  const phoneTitle = phone.title?.toLowerCase() || "";
  const isIPhone = phoneTitle.includes("iphone");
  if (osPreference === "ios" && isIPhone) return 100;
  if (osPreference === "android" && !isIPhone) return 100;
  return 0;
}

function getPriorityScore(phone, priorities) {
  if (!priorities.length) return 50;

  let score = 0;
  const specs = phone.specs || {};
  const phoneTitle = phone.title?.toLowerCase() || "";

  priorities.forEach((priority) => {
    switch (priority) {
      case "camera":
        if (specs.rear_camera_setup?.length > 2) score += 30;
        else if (specs.rear_camera_setup?.length > 0) score += 20;
        else if (phoneTitle.includes("pro") || phoneTitle.includes("camera"))
          score += 15;
        break;
      case "battery":
        if (specs.battery_capacity_mah > 4000) score += 30;
        else if (specs.battery_capacity_mah > 3000) score += 20;
        else if (phoneTitle.includes("max") || phoneTitle.includes("plus"))
          score += 15;
        break;
      case "performance":
        if (phoneTitle.includes("iphone")) score += 30;
        else if (specs.performance?.ram_gb?.[0] >= 8) score += 25;
        else if (phoneTitle.includes("pro") || phoneTitle.includes("gaming"))
          score += 20;
        break;
      case "screen":
        if (specs.display?.refresh_rate?.max_hz >= 120) score += 30;
        else if (specs.display?.refresh_rate?.max_hz >= 90) score += 20;
        else if (phoneTitle.includes("pro") || phoneTitle.includes("display"))
          score += 15;
        break;
      case "price":
        if (!phoneTitle.includes("iphone") && !phoneTitle.includes("pro"))
          score += 25;
        break;
      case "design":
        if (phoneTitle.includes("pro") || phoneTitle.includes("premium"))
          score += 25;
        break;
    }
  });

  return Math.min(100, score);
}

function getUsageScore(phone, survey) {
  let score = 50;
  const specs = phone.specs || {};
  const phoneTitle = phone.title?.toLowerCase() || "";

  switch (survey.primaryUse) {
    case "photography":
      if (specs.rear_camera_setup?.length > 2) score += 30;
      else if (phoneTitle.includes("pro") || phoneTitle.includes("camera"))
        score += 20;
      break;
    case "gaming":
      if (phoneTitle.includes("iphone") || specs.performance?.ram_gb?.[0] >= 8)
        score += 30;
      else if (phoneTitle.includes("gaming") || phoneTitle.includes("pro"))
        score += 20;
      break;
    case "streaming":
      if (specs.display?.size_in >= 6.5) score += 20;
      if (specs.battery_capacity_mah > 4000) score += 20;
      else if (phoneTitle.includes("max") || phoneTitle.includes("plus"))
        score += 15;
      break;
    case "work":
      if (phoneTitle.includes("iphone") || phoneTitle.includes("pro"))
        score += 25;
      break;
    case "basic":
      if (!phoneTitle.includes("pro") && !phoneTitle.includes("max"))
        score += 20;
      break;
  }
  // Factor in daily usage (battery needs)
  const usage = survey.batteryImportance; // e.g., '1-2h', '3-5h', '5-7h', '7h-plus'
  const cap = specs.battery_capacity_mah || 0;
  if (usage === "1-2h") {
    if (cap > 3500) score += 10;
  } else if (usage === "3-5h") {
    if (cap > 4000) score += 15;
    else if (cap > 3500) score += 5;
  } else if (usage === "5-7h") {
    if (cap > 4500) score += 25;
    else if (cap > 4000) score += 10;
  } else if (usage === "7h-plus") {
    if (cap > 5000) score += 30;
    else if (cap > 4500) score += 15;
  }

  return Math.min(100, score);
}

function getSpecsScore(phone, survey) {
  let score = 50;
  const specs = phone.specs || {};
  const phoneTitle = phone.title?.toLowerCase() || "";

  if (
    survey.screenSize === "compact" &&
    (specs.display?.size_in < 6 || phoneTitle.includes("mini"))
  )
    score += 20;
  else if (
    survey.screenSize === "standard" &&
    specs.display?.size_in >= 6 &&
    specs.display?.size_in <= 6.5
  )
    score += 20;
  else if (
    survey.screenSize === "large" &&
    (specs.display?.size_in > 6.5 ||
      phoneTitle.includes("max") ||
      phoneTitle.includes("plus"))
  )
    score += 20;

  if (survey.storage === "basic" && specs.storage_options_gb?.[0] >= 64)
    score += 15;
  else if (
    survey.storage === "moderate" &&
    specs.storage_options_gb?.some((s) => s >= 256)
  )
    score += 15;
  else if (
    survey.storage === "high" &&
    specs.storage_options_gb?.some((s) => s >= 512)
  )
    score += 15;

  return Math.min(100, score);
}

function generateReasons(phone, survey) {
  const reasons = [];
  const specs = phone.specs || {};
  const phoneTitle = phone.title?.toLowerCase() || "";

  const budgetLabel =
    budgetOptions.find((b) => b.value === survey.budget)?.label || "budget";
  reasons.push(`Fits your ${budgetLabel} budget range`);

  // Daily usage reason
  const usageLabel = batteryOptions.find(
    (b) => b.value === survey.batteryImportance
  )?.label;
  if (usageLabel) {
    reasons.push(`Suited for ${usageLabel}`);
  }

  const personas = survey.priorities || [];
  if (personas.length) {
    const labelMap = {
      student: "student needs",
      business: "business productivity",
      creator: "content creation",
      gamer: "gaming",
      senior: "ease of use",
      traveler: "travel and battery life",
      fashion: "style preferences",
      value: "value for money",
    };
    const personaLabels = personas
      .slice(0, 2)
      .map((p) => labelMap[p] || p)
      .join(" & ");
    reasons.push(`Great fit for ${personaLabels}`);
  }

  const derived = deriveFeaturePrioritiesFromPersonas(survey.priorities);
  if (derived.includes("camera")) {
    if (specs.rear_camera_setup?.length > 2) {
      reasons.push(
        `Excellent camera system with ${specs.rear_camera_setup.length} lenses`
      );
    } else if (phoneTitle.includes("pro")) {
      reasons.push("Pro-level camera capabilities");
    }
  }

  if (derived.includes("battery")) {
    if (specs.battery_capacity_mah > 4000) {
      reasons.push(`Long-lasting ${specs.battery_capacity_mah}mAh battery`);
    } else if (phoneTitle.includes("max") || phoneTitle.includes("plus")) {
      reasons.push("Extended battery life for all-day use");
    }
  }

  if (derived.includes("performance") && phoneTitle.includes("iphone")) {
    reasons.push("Top-tier performance with Apple Silicon");
  } else if (
    derived.includes("performance") &&
    specs.performance?.ram_gb?.[0] >= 8
  ) {
    reasons.push(`High performance with ${specs.performance.ram_gb[0]}GB RAM`);
  }

  if (survey.primaryUse === "photography") {
    reasons.push("Optimized for photography enthusiasts");
  } else if (survey.primaryUse === "gaming") {
    reasons.push("Great for mobile gaming");
  } else if (survey.primaryUse === "streaming") {
    reasons.push("Perfect for video streaming and media");
  }

  return reasons.slice(0, 3);
}
</script>

<style scoped>
.survey {
  padding: 1.5rem 0;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Progress Bar */
.progress-container {
  margin-bottom: 3rem;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  border-radius: 20px;
  transition: width 0.5s ease;
}

.progress-text {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0;
}

/* Step Container */
.step-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step {
  width: 100%;
  text-align: center;
}

.step h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.step > p {
  color: var(--muted);
  font-size: 1.1rem;
  margin-bottom: 2.5rem;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Budget Options */
.budget-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.budget-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.budget-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.budget-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.budget-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.budget-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1.1rem;
}

.budget-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

/* Priorities Grid */
.priorities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto 1rem;
}

.priority-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.priority-card:hover:not(.disabled) {
  border-color: var(--brand-2);
  transform: translateY(-2px);
}

.priority-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-2px);
}

.priority-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.priority-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.priority-card h4 {
  margin: 0 0 0.25rem;
  color: var(--text);
  font-size: 0.9rem;
}

.priority-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
}

.selected-count {
  color: var(--brand-1);
  font-weight: 600;
  margin-top: 1rem;
}

.selected-count.error {
  color: #fca5a5; /* light red */
}

/* Usage Options */
.usage-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
}

.usage-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.usage-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.usage-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.usage-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.usage-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1rem;
}

.usage-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

/* Battery Options */
.battery-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.battery-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.battery-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.battery-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.battery-level {
  margin-bottom: 1rem;
}

.battery-icon {
  width: 60px;
  height: 30px;
  border: 2px solid var(--muted);
  border-radius: 4px;
  position: relative;
  margin: 0 auto;
  background: rgba(51, 65, 85, 0.3);
}

.battery-icon::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 12px;
  background: var(--muted);
  border-radius: 0 2px 2px 0;
}

.battery-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.battery-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1rem;
}

.battery-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

/* OS Options */
.os-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.os-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.os-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.os-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.os-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.os-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1.1rem;
}

.os-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

/* Screen Options */
.screen-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.screen-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.screen-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.screen-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.phone-mockup {
  margin: 0 auto 1rem;
  border: 3px solid var(--muted);
  border-radius: 12px;
  position: relative;
  background: rgba(51, 65, 85, 0.5);
}

.phone-mockup.small {
  width: 40px;
  height: 80px;
}

.phone-mockup.medium {
  width: 50px;
  height: 90px;
}

.phone-mockup.large {
  width: 60px;
  height: 100px;
}

.screen {
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  background: linear-gradient(45deg, var(--brand-2), var(--brand-1));
  border-radius: 6px;
}

.screen-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1rem;
}

.screen-card p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

/* Storage Options */
.storage-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
}

.storage-card {
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.storage-card:hover {
  border-color: var(--brand-2);
  transform: translateY(-4px);
}

.storage-card.active {
  border-color: var(--brand-1);
  background: rgba(34, 211, 238, 0.1);
  transform: translateY(-4px);
}

.storage-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.storage-card h4 {
  margin: 0 0 0.5rem;
  color: var(--text);
  font-size: 1rem;
}

.storage-card p {
  margin: 0 0 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.storage-examples {
  font-size: 0.75rem;
  color: var(--brand-1);
  font-style: italic;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loader {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(96, 165, 250, 0.3);
  border-top: 4px solid var(--brand-2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state h3 {
  margin: 0 0 0.5rem;
  color: var(--text);
}

.loading-state p {
  margin: 0;
  color: var(--muted);
}

/* Results */
.results h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.results > p {
  text-align: center;
  color: var(--muted);
  margin-bottom: 2rem;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.recommendation-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  animation: slideInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
}

.phone-image img {
  width: 80px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  background: rgba(51, 65, 85, 0.3);
}

.phone-info h4 {
  margin: 0 0 1rem;
  color: var(--text);
  font-size: 1.1rem;
}

.reasons h5 {
  margin: 0 0 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.reasons ul {
  margin: 0 0 1rem;
  padding-left: 1rem;
  color: var(--text);
  font-size: 0.8rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.view-specs-btn,
.compare-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-specs-btn {
  background: var(--brand-2);
  color: white;
}

.compare-btn {
  background: rgba(51, 65, 85, 0.8);
  color: var(--text);
}

.view-specs-btn:hover {
  background: var(--brand-1);
}

.compare-btn:hover {
  background: rgba(71, 85, 105, 0.8);
}

/* Survey Actions */
.survey-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  color: white;
}

.secondary-btn {
  background: rgba(51, 65, 85, 0.8);
  color: var(--text);
}

.primary-btn:hover {
  transform: translateY(-2px);
}

.secondary-btn:hover {
  background: rgba(71, 85, 105, 0.8);
}

/* Navigation */
.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.nav-btn.primary {
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  color: white;
}

.nav-btn.secondary {
  background: rgba(51, 65, 85, 0.8);
  color: var(--text);
}

.nav-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }

  .step h2 {
    font-size: 1.5rem;
  }

  .budget-options,
  .usage-options,
  .battery-options,
  .os-options,
  .screen-options,
  .storage-options {
    grid-template-columns: 1fr;
  }

  .priorities-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .navigation {
    flex-direction: column;
    gap: 1rem;
  }

  .survey-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .priorities-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
