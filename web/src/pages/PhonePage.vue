<template>
  <div class="page phone">
    <div class="container">
      <header class="page-header">
        <h1>Latest & Greatest Phones</h1>
        <p>Explore our curated list of top-tier refurbished smartphones.</p>
      </header>
      <div class="controls">
        <label class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="search"
            v-model.trim="searchQuery"
            placeholder="Search by name (e.g. Pixel 8)"
            class="search-input"
          />
        </label>
        <label class="brand-filter">
          <span>Brand:</span>
          <select v-model="brand" @change="loadPhones">
            <option value="all">All (latest mix)</option>
            <option value="apple">Apple</option>
            <option value="samsung">Samsung</option>
            <option value="google">Google</option>
          </select>
        </label>
      </div>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading phones...</p>
      </div>
      <div v-else-if="error" class="error-state">{{ error }}</div>
      <div v-else-if="!filteredPhones.length" class="no-results">
        <h3>No phones found</h3>
        <p>
          No phones matched your search for "{{ searchQuery }}". Try a different
          search.
        </p>
      </div>
      <TransitionGroup
        v-else
        tag="ul"
        name="card-list"
        class="phones"
        appear
      >
        <li
          v-for="(phone, index) in filteredPhones"
          :key="phone.link"
          :style="{ '--delay': index * 0.05 + 's' }"
        >
          <img :src="phone.image" :alt="phone.title" />
          <div class="card-text">
            <h3>{{ phone.title }}</h3>
            <template v-if="phone.specs">
              <button class="spec-btn" @click="openSpecs(phone)">
                View specs
              </button>
            </template>
            <template v-else>
              <a :href="phone.full_url" target="_blank" rel="noreferrer"
                >View specs</a
              >
            </template>
          </div>
        </li>
      </TransitionGroup>

      <!-- Specs Modal -->
      <Transition name="modal-fade">
        <div
          v-if="selectedPhone"
          class="spec-modal-backdrop"
          @click.self="closeSpecs"
        >
          <div
            class="spec-modal"
            role="dialog"
            :aria-label="selectedPhone.title + ' specifications'"
          >
            <button class="close" @click="closeSpecs">✕</button>
            <header class="spec-head">
              <img :src="selectedPhone.image" :alt="selectedPhone.title" />
              <div>
                <h2>{{ selectedPhone.title }}</h2>
                <p class="ext-link">
                  <a
                    :href="selectedPhone.full_url"
                    target="_blank"
                    rel="noreferrer"
                    >Open full GSM Arena page ↗</a
                  >
                </p>
              </div>
            </header>
            <section class="spec-body" v-if="selectedPhone.specs">
              <div class="spec-columns">
                <div class="spec-group">
                  <h4>Overview</h4>
                  <ul>
                    <li>
                      <strong>Model:</strong>
                      {{ selectedPhone.specs.model_name }}
                    </li>
                    <li v-if="selectedPhone.specs.release_date">
                      <strong>Release:</strong>
                      {{ selectedPhone.specs.release_date }}
                    </li>
                    <li v-if="selectedPhone.specs.dimensions_mm">
                      <strong>Dimensions:</strong>
                      {{ selectedPhone.specs.dimensions_mm }}
                    </li>
                    <li v-if="selectedPhone.specs.weight_g">
                      <strong>Weight:</strong>
                      {{ selectedPhone.specs.weight_g }} g
                    </li>
                    <li v-if="selectedPhone.specs.water_resistance_rating">
                      <strong>Water:</strong>
                      {{ selectedPhone.specs.water_resistance_rating }}
                    </li>
                  </ul>
                </div>
                <div class="spec-group" v-if="selectedPhone.specs.display">
                  <h4>Display</h4>
                  <ul>
                    <li>
                      <strong>Size:</strong>
                      {{ selectedPhone.specs.display.size_in }}"
                    </li>
                    <li>
                      <strong>Resolution:</strong>
                      {{ selectedPhone.specs.display.resolution }}
                    </li>
                    <li>
                      <strong>Type:</strong>
                      {{ selectedPhone.specs.display.type }}
                    </li>
                    <li v-if="selectedPhone.specs.display.refresh_rate">
                      <strong>Refresh:</strong>
                      {{ selectedPhone.specs.display.refresh_rate.max_hz }} Hz
                      (adaptive)
                    </li>
                  </ul>
                </div>
                <div class="spec-group" v-if="selectedPhone.specs.performance">
                  <h4>Performance</h4>
                  <ul>
                    <li>
                      <strong>SoC:</strong>
                      {{ selectedPhone.specs.performance.soc }}
                    </li>
                    <li>
                      <strong>CPU:</strong>
                      {{ selectedPhone.specs.performance.cpu }}
                    </li>
                    <li>
                      <strong>GPU:</strong>
                      {{ selectedPhone.specs.performance.gpu }}
                    </li>
                    <li v-if="selectedPhone.specs.performance.ram_gb">
                      <strong>RAM:</strong>
                      {{ selectedPhone.specs.performance.ram_gb.join(", ") }}
                      GB
                    </li>
                  </ul>
                </div>
                <div class="spec-group">
                  <h4>Memory</h4>
                  <ul>
                    <li v-if="selectedPhone.specs.storage_options_gb">
                      <strong>Storage:</strong>
                      {{ selectedPhone.specs.storage_options_gb.join(", ") }}
                      GB
                    </li>
                    <li>
                      <strong>Expandable:</strong>
                      {{
                        selectedPhone.specs.expandable_storage ? "Yes" : "No"
                      }}
                    </li>
                  </ul>
                </div>
                <div class="spec-group">
                  <h4>Battery</h4>
                  <ul>
                    <li v-if="selectedPhone.specs.battery_capacity_mah">
                      <strong>Capacity:</strong>
                      {{ selectedPhone.specs.battery_capacity_mah }} mAh
                    </li>
                    <li v-if="selectedPhone.specs.fast_charging_details">
                      <strong>Charging:</strong>
                      {{ selectedPhone.specs.fast_charging_details }}
                    </li>
                  </ul>
                </div>
                <div
                  class="spec-group"
                  v-if="selectedPhone.specs.rear_camera_setup"
                >
                  <h4>Cameras (Rear)</h4>
                  <ul>
                    <li
                      v-for="(cam, i) in selectedPhone.specs.rear_camera_setup"
                      :key="i"
                    >
                      {{ cam.sensor_mp }}MP {{ cam.type
                      }}<span v-if="cam.optical_zoom">
                        ({{ cam.optical_zoom }} opt zoom)</span
                      >
                    </li>
                  </ul>
                </div>
                <div class="spec-group" v-if="selectedPhone.specs.front_camera">
                  <h4>Front Camera</h4>
                  <ul>
                    <li>
                      {{ selectedPhone.specs.front_camera.sensor_mp }}MP ({{
                        selectedPhone.specs.front_camera.aperture
                      }})
                    </li>
                  </ul>
                </div>
                <div class="spec-group" v-if="selectedPhone.specs.connectivity">
                  <h4>Connectivity</h4>
                  <ul>
                    <li v-if="selectedPhone.specs.connectivity['5g']">
                      <strong>5G:</strong> Yes
                    </li>
                    <li v-if="selectedPhone.specs.connectivity.wifi">
                      <strong>Wi-Fi:</strong>
                      {{ selectedPhone.specs.connectivity.wifi }}
                    </li>
                    <li v-if="selectedPhone.specs.connectivity.bluetooth">
                      <strong>Bluetooth:</strong>
                      {{ selectedPhone.specs.connectivity.bluetooth }}
                    </li>
                    <li v-if="selectedPhone.specs.connectivity.nfc">
                      <strong>NFC:</strong> Yes
                    </li>
                    <li v-if="selectedPhone.specs.connectivity.usb_port">
                      <strong>USB:</strong>
                      {{ selectedPhone.specs.connectivity.usb_port }}
                    </li>
                  </ul>
                </div>
                <div class="spec-group" v-if="selectedPhone.specs.sensors">
                  <h4>Sensors</h4>
                  <p class="inline-list">
                    {{ selectedPhone.specs.sensors.join(", ") }}
                  </p>
                </div>
              </div>
              <footer class="modal-footer">
                <button class="close-btn" @click="closeSpecs">Close</button>
              </footer>
            </section>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const phones = ref([]);
const loading = ref(true);
const error = ref("");
const selectedPhone = ref(null);
const brand = ref("all");
const searchQuery = ref("");

const filteredPhones = computed(() => {
  let a = [...phones.value];

  // Sort by release date, newest first
  a.sort((a, b) => {
    const dateA = a.specs?.release_date ? new Date(a.specs.release_date) : null;
    const dateB = b.specs?.release_date ? new Date(b.specs.release_date) : null;

    if (dateA instanceof Date && !isNaN(dateA)) {
      if (dateB instanceof Date && !isNaN(dateB)) {
        return dateB - dateA; // Both are valid dates
      }
      return -1; // Only A is valid, so A comes first
    }
    if (dateB instanceof Date && !isNaN(dateB)) {
      return 1; // Only B is valid, so B comes first
    }
    return 0; // Both are invalid, keep original order
  });

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    a = a.filter((phone) => phone.title.toLowerCase().includes(query));
  }

  return a;
});

async function loadPhones() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch(
      `/api/phones?brand=${encodeURIComponent(brand.value)}`
    );
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    phones.value = (data.phones || []).slice(0, 100); // Increased cap for more results
  } catch (err) {
    console.error(err);
    error.value = "Unable to fetch phones.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadPhones);

function openSpecs(phone) {
  selectedPhone.value = phone;
}
function closeSpecs() {
  selectedPhone.value = null;
}
</script>

<style scoped>
/* Page and Container */
.phone {
  padding-block: 2rem 3rem;
  background-color: #020617; /* Fallback */
  background-image: radial-gradient(
    circle at 25% 20%,
    hsl(222, 47%, 11%) 0%,
    #020617 40%
  );
  color: #e2e8f0;
  min-height: 100vh;
}
.container {
  max-width: 1320px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 5vw, 4rem);
  width: 100%;
  box-sizing: border-box;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.page-header h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  margin: 0 0 0.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(45deg, #a5b4fc, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header p {
  font-size: 1.1rem;
  color: #94a3b8;
  max-width: 50ch;
  margin: 0 auto;
}

/* Controls */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1rem;
  background: #0f172a90;
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid #1e293b;
  position: sticky;
  top: 1rem;
  z-index: 10;
}
.search-wrapper {
  position: relative;
  flex-grow: 1;
  min-width: 280px;
}
.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.search-input {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0.7rem 1rem 0.7rem 2.8rem;
  width: 100%;
  transition: all 0.2s;
  font-size: 1rem;
}
.search-input:focus-visible {
  outline: 2px solid #38bdf8;
  border-color: #38bdf8;
  background: #0f172a;
}
.search-input::placeholder {
  color: #64748b;
}

.brand-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.brand-filter span {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}
.controls select {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* States */
.loading-state,
.error-state,
.no-results {
  text-align: center;
  padding: 5rem 1rem;
  background: #0f172a80;
  border-radius: 12px;
}
.loading-state p {
  margin-top: 1rem;
  color: #94a3b8;
  font-size: 1rem;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #fca5a5;
}
.no-results h3 {
  margin: 0 0 0.5rem;
}
.no-results p {
  color: #94a3b8;
  margin: 0;
}

/* Phone Grid & Cards */
.phones {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}
.phones li {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  text-align: left;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
  will-change: transform;
}
.phones li:hover {
  transform: translateY(-6px);
  border-color: #38bdf860;
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.4),
    0 4px 10px -6px rgba(0, 0, 0, 0.1);
}
.phones img {
  width: 100%;
  aspect-ratio: 0.8;
  object-fit: cover;
  border-bottom: 1px solid #1e293b;
}
.card-text {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.card-text h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  flex-grow: 1;
  line-height: 1.4;
}
.spec-btn {
  background: #38bdf8;
  border: 0;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  color: #020617;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  align-self: flex-start;
  transition: background-color 0.2s, transform 0.2s;
}
.spec-btn:hover {
  background: #7dd3fc;
  transform: scale(1.05);
}

/* Card Entry Animation */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-delay: var(--delay, 0s);
}
.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Modal Transitions & Styling */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-active .spec-modal,
.modal-fade-leave-active .spec-modal {
  transition: transform 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .spec-modal,
.modal-fade-leave-to .spec-modal {
  transform: scale(0.95) translateY(-20px);
}

.spec-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 3rem 1rem 2rem;
  overflow-y: auto;
  z-index: 100;
}
.spec-modal {
  background: #0b152b;
  border-radius: 16px;
  max-width: 980px;
  width: 100%;
  padding: 1.2rem 1.4rem 1.4rem;
  color: #e2e8f0;
  position: relative;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.6);
  border: 1px solid #1e293b;
}
.spec-modal header.spec-head {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #1e293b;
}
.spec-head img {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.spec-head h2 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}
.ext-link a {
  font-size: 0.8rem;
  color: #60a5fa;
  text-decoration: none;
}
.ext-link a:hover {
  text-decoration: underline;
}
.spec-columns {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
}
.spec-group {
  background: #13223d;
  padding: 0.75rem 0.9rem 0.9rem;
  border-radius: 10px;
}
.spec-group h4 {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #93c5fd;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.4rem;
}
.spec-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
  font-size: 0.8rem;
}
.spec-group li strong {
  color: #bfdbfe;
  font-weight: 600;
}
.inline-list {
  font-size: 0.75rem;
  line-height: 1.3;
}
.close {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: transparent;
  border: 0;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}
.modal-footer {
  margin-top: 1.5rem;
  text-align: center;
  grid-column: 1 / -1;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
}
.close-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.close-btn:hover {
  background: #334155;
}

@media (max-width: 640px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    top: 0;
    border-radius: 0;
  }
  .spec-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .spec-head img {
    width: 100%;
    height: auto;
  }
}
</style>
