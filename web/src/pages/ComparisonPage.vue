<template>
  <div class="page comparison-page">
    <div class="container">
      <div class="header">
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>Compare Devices</h1>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading specs...</p>
      </div>

      <div v-else-if="phones.length === 0" class="empty">
        <p>No phones selected for comparison.</p>
        <button @click="$router.push('/chat')">Find Phones</button>
      </div>

      <div v-else class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="feature-col">Feature</th>
              <th v-for="phone in phones" :key="phone.title">
                <div class="th-content">
                  <img v-if="phone.image" :src="phone.image" alt="Phone" class="phone-thumb" />
                  <h3>{{ phone.title }}</h3>
                  <div class="price-tag">${{ Math.round(phone.normalized.price) }}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparisonRows" :key="row.label">
              <td class="feature-label">{{ row.label }}</td>
              <td v-for="phone in phones" :key="phone.title">
                <span v-if="row.key === 'score'" class="score-badge" :class="getScoreClass(phone.score)">
                  {{ phone.score || 'N/A' }}
                </span>
                <span v-else>{{ getValue(phone, row.key) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const loading = ref(true)
const phones = ref([])

const comparisonRows = [
  { label: 'Release Year', key: 'normalized.year' },
  { label: 'Screen Size', key: 'specs.display.size_in' },
  { label: 'Resolution', key: 'specs.display.resolution' },
  { label: 'Processor', key: 'specs.platform.chipset' },
  { label: 'RAM', key: 'specs.memory.ram' },
  { label: 'Storage', key: 'specs.memory.internal' },
  { label: 'Main Camera', key: 'specs.rear_camera_setup' },
  { label: 'Battery', key: 'specs.battery.capacity' },
  { label: 'OS', key: 'specs.platform.os' },
]

function getValue(phone, key) {
  const keys = key.split('.')
  let val = phone
  for (const k of keys) {
    val = val?.[k]
  }
  
  if (key === 'specs.rear_camera_setup' && Array.isArray(val)) {
      return val.map(c => c.resolution).join(', ')
  }
  
  if (key === 'specs.display.size_in') return val ? `${val}"` : '-'
  
  return val || '-'
}

function getScoreClass(score) {
    if (score >= 90) return 'high'
    if (score >= 70) return 'med'
    return 'low'
}

onMounted(async () => {
  const phoneNames = (route.query.phones || '').split(',').filter(Boolean)
  
  if (phoneNames.length === 0) {
    loading.value = false
    return
  }

  try {
    // Fetch all phones (optimization: backend should support filtering by names)
    // For now, we fetch all and filter client side as dataset is small
    const { data } = await axios.get(`${API_BASE}/api/recommendations/all`)
    
    const allPhones = data.phones || []
    
    // Filter matches
    phones.value = phoneNames.map(name => {
        return allPhones.find(p => p.title === name)
    }).filter(Boolean)

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.comparison-page {
  padding-top: 80px;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.back-btn {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.back-btn:hover { border-color: #cbd5e1; color: #cbd5e1; }

h1 {
  margin: 0;
  background: linear-gradient(90deg, #22d3ee, #818cf8);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.comparison-table-wrapper {
  overflow-x: auto;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid #334155;
  padding: 1rem;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

th, td {
  padding: 1.5rem;
  text-align: left;
  border-bottom: 1px solid #334155;
}

th {
  vertical-align: bottom;
}

.feature-col {
  width: 200px;
  color: #94a3b8;
  font-weight: 600;
}

.feature-label {
  color: #94a3b8;
  font-weight: 500;
}

.th-content {
  text-align: center;
}

.phone-thumb {
  height: 120px;
  object-fit: contain;
  margin-bottom: 1rem;
}

.th-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.price-tag {
  color: #22d3ee;
  font-weight: 700;
  font-size: 1.2rem;
}

.loading, .empty {
  text-align: center;
  padding: 4rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(34, 211, 238, 0.3);
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
