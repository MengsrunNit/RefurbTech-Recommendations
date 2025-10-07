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
            <option value="oneplus">OnePlus</option>
          </select>
        </label>
      </div>
      <div v-if="loading">Loading…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else class="phones">
        <li v-for="phone in phones" :key="phone.link">
          <img :src="phone.image" :alt="phone.title" />
          <div>
            <h3>{{ phone.title }}</h3>
            <a :href="phone.full_url" target="_blank" rel="noreferrer"
              >View specs</a
            >
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const phones = ref([]);
const loading = ref(true);
const error = ref("");

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
</style>
