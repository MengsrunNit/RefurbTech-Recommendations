<template>
  <div class="page phone">
    <div class="container">
      <div class="controls">
        <h2>Phones</h2>
        <label>
          Brand:
          <select v-model="brand" @change="loadPhones">
            <option value="all">All (latest mix)</option>
            <option value="apple">Apple</option>
            <option value="samsung">Samsung</option>
            <option value="google">Google</option>
          </select>
        </label>
      </div>
      <div v-if="loading">Loading…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else class="phones">
        <li v-for="phone in phones" :key="phone.link">
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
      </ul>

      <!-- Specs Modal -->
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
                    <strong>Model:</strong> {{ selectedPhone.specs.model_name }}
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
                    {{ selectedPhone.specs.performance.ram_gb.join(", ") }} GB
                  </li>
                </ul>
              </div>
              <div class="spec-group">
                <h4>Memory</h4>
                <ul>
                  <li v-if="selectedPhone.specs.storage_options_gb">
                    <strong>Storage:</strong>
                    {{ selectedPhone.specs.storage_options_gb.join(", ") }} GB
                  </li>
                  <li>
                    <strong>Expandable:</strong>
                    {{ selectedPhone.specs.expandable_storage ? "Yes" : "No" }}
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const phones = ref([]);
const loading = ref(true);
const error = ref("");
const selectedPhone = ref(null);

async function loadPhones() {
  loading.value = true;
  try {
    const res = await fetch(
      `/api/phones?brand=${encodeURIComponent(brand.value)}`
    );
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    phones.value = (data.phones || []).slice(0, 60); // cap for UI
  } catch (err) {
    console.error(err);
    error.value = "Unable to fetch phones.";
  } finally {
    loading.value = false;
  }
}

const brand = ref("all");
onMounted(loadPhones);

function openSpecs(phone) {
  selectedPhone.value = phone;
}
function closeSpecs() {
  selectedPhone.value = null;
}
</script>

<style scoped>
.phone {
  /* vertical breathing room; side padding comes from .container */
  padding-block: 1.25rem 2rem;
}
.container {
  /* center content and limit line length on large screens */
  max-width: 1200px;
  margin-inline: auto;
  /* responsive side padding: 16px on mobile up to 48px on wide screens */
  padding-inline: clamp(16px, 5vw, 48px);
  width: 100%;
  box-sizing: border-box;
}
.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}
.controls select {
  padding: 0.4rem;
  border-radius: 8px;
}
.error {
  color: crimson;
}
.phones {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.phones li {
  background: #0f172a;
  border-radius: 12px;
  padding: 1rem;
  color: #e2e8f0;
  display: grid;
  gap: 0.6rem;
  text-align: left;
}
.phones img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 8px;
}
.phones a {
  color: #38bdf8;
}
.card-text h3 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}
.spec-btn {
  background: #38bdf8;
  border: 0;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  color: #012;
  cursor: pointer;
  font-size: 0.75rem;
}
/* Modal styling */
.spec-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
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
}
.spec-modal header.spec-head {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
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
  font-size: 1.25rem;
}
.ext-link a {
  font-size: 0.75rem;
  color: #60a5fa;
}
.spec-columns {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.spec-group {
  background: #13223d;
  padding: 0.75rem 0.8rem 0.9rem;
  border-radius: 10px;
}
.spec-group h4 {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #93c5fd;
}
.spec-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
  font-size: 0.75rem;
}
.spec-group li strong {
  color: #bfdbfe;
  font-weight: 600;
}
.inline-list {
  font-size: 0.7rem;
  line-height: 1.2;
}
.close {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: transparent;
  border: 0;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-footer {
  margin-top: 1.2rem;
  text-align: center;
  grid-column: 1/-1;
}
.close-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
.close-btn:hover {
  background: #334155;
}
@media (max-width: 640px) {
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
