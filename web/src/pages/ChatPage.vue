<template>
  <div class="page ai-finder-page">
    <div class="container">
      
      <!-- Hero / Search Section -->
      <div class="search-container" :class="{ 'compact': hasResults }">
        <div class="header-content" v-if="!hasResults">
          <h1>AI Phone Finder</h1>
          <p>Describe your perfect phone in plain English.</p>
        </div>

        <div class="input-box">
          <textarea
            v-model="input"
            ref="inputRef"
            placeholder="e.g. I need a phone under $400 with a great camera for instagram..."
            rows="1"
            @keydown.enter.prevent="search"
            @input="autoResize"
          ></textarea>
          <button @click="search" :disabled="loading || !input.trim()" class="search-btn">
            <span v-if="loading" class="loader"></span>
            <span v-else>Search</span>
          </button>
        </div>

        <div v-if="!hasResults" class="suggestions">
          <span class="label">Try asking:</span>
          <div class="tags">
            <button v-for="s in suggestions" :key="s" @click="useSuggestion(s)">{{ s }}</button>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <transition name="fade-up">
        <div v-if="hasResults" class="results-container">
          
          <!-- AI Insight -->
          <div class="ai-insight">
            <div class="insight-icon">✨</div>
            <div class="insight-content">
              <h3>AI Recommendation</h3>
              <div class="markdown-body" v-html="renderMarkdown(summary)"></div>
            </div>
          </div>

          <!-- Product Grid -->
          <div class="products-grid">
            <div 
              v-for="(phone, index) in recommendations" 
              :key="index" 
              class="product-card"
              :class="{ 'selected': selectedPhones.includes(phone.name) }"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="card-badge" v-if="index === 0">Top Match</div>
              
              <div class="card-image">
                <img v-if="phone.image" :src="phone.image" alt="Phone" />
                <div v-else class="placeholder">📱</div>
              </div>
              
              <div class="card-details">
                <h3>{{ phone.name }}</h3>
                <div class="price">{{ phone.price_range }}</div>
                <div class="reason-box">
                  <span class="icon">💡</span>
                  <p>{{ phone.reason }}</p>
                </div>
                
                <div class="card-actions">
                  <button class="view-btn">View Specs</button>
                  <button 
                    class="compare-btn" 
                    :class="{ active: selectedPhones.includes(phone.name) }"
                    @click="toggleCompare(phone.name)"
                    :disabled="selectedPhones.length >= 3 && !selectedPhones.includes(phone.name)"
                  >
                    {{ selectedPhones.includes(phone.name) ? 'Selected' : 'Compare' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Comparison Floating Bar -->
          <transition name="slide-up">
            <div v-if="selectedPhones.length > 0" class="compare-bar">
              <div class="compare-info">
                <span class="count">{{ selectedPhones.length }}</span>
                <span>selected for comparison (max 3)</span>
              </div>
              <button 
                class="go-compare-btn" 
                @click="goToComparison"
                :disabled="selectedPhones.length < 2"
              >
                Compare Now {{ selectedPhones.length >= 2 ? '→' : '(Select 2+)' }}
              </button>
            </div>
          </transition>

          <div class="actions">
            <button @click="clearResults" class="reset-btn">Start New Search</button>
          </div>

        </div>
      </transition>

      <!-- Loading Overlay -->
      <div v-if="loading && !hasResults" class="loading-state">
        <div class="spinner-container">
          <div class="spinner-ring"></div>
          <div class="spinner-core"></div>
        </div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const router = useRouter()
// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
// const CHAT_URL = `${API_BASE}/api/chat`

const input = ref('')
const loading = ref(false)
const loadingText = ref('Analyzing your needs...')
const inputRef = ref(null)
const summary = ref('')
const recommendations = ref([])
const selectedPhones = ref([])

const hasResults = computed(() => recommendations.value.length > 0)

const loadingMessages = [
  "Analyzing your needs...",
  "Scanning refurbished market...",
  "Comparing prices...",
  "Checking camera specs...",
  "Finding best deals...",
  "Synthesizing recommendations..."
]
let loadingInterval = null

const suggestions = [
  "Best gaming phone under $500",
  "Cheap iPhone for my kid",
  "Samsung with good battery life",
  "Phone for photography under $600"
]

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function useSuggestion(text) {
  input.value = text
  search()
}

function clearResults() {
  recommendations.value = []
  summary.value = ''
  input.value = ''
  selectedPhones.value = []
  nextTick(() => {
    if(inputRef.value) {
        inputRef.value.style.height = 'auto';
        inputRef.value.focus();
    }
  })
}

function toggleCompare(phoneName) {
  if (selectedPhones.value.includes(phoneName)) {
    selectedPhones.value = selectedPhones.value.filter(p => p !== phoneName)
  } else {
    if (selectedPhones.value.length < 3) {
      selectedPhones.value.push(phoneName)
    }
  }
}

function goToComparison() {
  if (selectedPhones.value.length < 2) return
  router.push({ 
    name: 'Comparison', 
    query: { phones: selectedPhones.value.join(',') } 
  })
}

async function search() {
  const text = input.value.trim()
  if (!text || loading.value) return

  loading.value = true
  
  // Cycle loading messages
  let msgIndex = 0
  loadingText.value = loadingMessages[0]
  loadingInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length
    loadingText.value = loadingMessages[msgIndex]
  }, 1500)
  
  // If we already have results, clear them to show loading state or just update?
  // Let's keep it simple: clear old results to show we are working
  if (hasResults.value) {
      recommendations.value = []
      selectedPhones.value = []
  }

  try {
    // We send the history as a single turn for this "Search" style
    const messages = [{ role: 'user', content: text }]
    
    const { data } = await axios.post('/api/chat', {
      messages
    })

    summary.value = data.reply
    recommendations.value = data.recommendations || []

  } catch (err) {
    console.error(err)
    summary.value = "Sorry, I encountered an error while searching. Please try again."
  } finally {
    loading.value = false
    if (loadingInterval) clearInterval(loadingInterval)
  }
}

marked.setOptions({ breaks: true, gfm: true })
function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ''))
}
</script>

<style scoped>
.ai-finder-page {
  padding-top: 80px;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Search Container */
.search-container {
  text-align: center;
  transition: all 0.5s ease;
  margin-top: 10vh;
}

.search-container.compact {
  margin-top: 0;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #22d3ee, #818cf8);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-content p {
  color: #94a3b8;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.input-box {
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 16px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  max-width: 700px;
  margin: 0 auto;
  transition: border-color 0.2s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.input-box:focus-within {
  border-color: #22d3ee;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.1);
}

textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.1rem;
  padding: 0.8rem;
  resize: none;
  font-family: inherit;
}

textarea:focus { outline: none; }

.search-btn {
  background: #22d3ee;
  color: #0f172a;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;
}

.search-btn:hover:not(:disabled) { transform: scale(1.05); }
.search-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.suggestions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.suggestions .label { color: #64748b; font-size: 0.9rem; }

.tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
}

.tags button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.tags button:hover {
  border-color: #22d3ee;
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.05);
}

/* Results */
.results-container {
  width: 100%;
}

.ai-insight {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  backdrop-filter: blur(10px);
}

.insight-icon { font-size: 1.5rem; }

.insight-content h3 {
  margin: 0 0 0.5rem;
  color: #22d3ee;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.markdown-body {
  color: #e2e8f0;
  line-height: 1.6;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.product-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-color: #22d3ee;
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #22d3ee;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  z-index: 10;
}

.card-image {
  height: 200px;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.card-image img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.placeholder { font-size: 4rem; }

.card-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-details h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.price {
  color: #22d3ee;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.reason-box {
  background: rgba(34, 211, 238, 0.1);
  border-radius: 8px;
  padding: 0.8rem;
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  flex: 1;
}

.reason-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  flex: 1;
  padding: 0.8rem;
  background: #334155;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.view-btn:hover { background: #475569; }

.compare-btn {
  flex: 1;
  padding: 0.8rem;
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.compare-btn:hover:not(:disabled) {
  border-color: #22d3ee;
  color: #22d3ee;
}

.compare-btn.active {
  background: rgba(34, 211, 238, 0.2);
  border-color: #22d3ee;
  color: #22d3ee;
}

.compare-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-card.selected {
  border-color: #22d3ee;
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.3);
}

/* Compare Bar */
.compare-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  border: 1px solid #334155;
  padding: 1rem 2rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  z-index: 100;
  min-width: 400px;
  justify-content: space-between;
}

.compare-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #e2e8f0;
}

.compare-info .count {
  background: #22d3ee;
  color: #0f172a;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.go-compare-btn {
  background: #22d3ee;
  color: #0f172a;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.go-compare-btn:hover:not(:disabled) { transform: scale(1.05); }
.go-compare-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #475569; color: #94a3b8; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100px); opacity: 0; }

.actions { text-align: center; }
.reset-btn {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.reset-btn:hover { border-color: #cbd5e1; color: #cbd5e1; }

/* Loading */
.loading-state {
  text-align: center;
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: #22d3ee;
  border-right-color: #22d3ee;
  border-radius: 50%;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

.spinner-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: #60a5fa;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
}

.loading-text {
  font-size: 1.2rem;
  color: #94a3b8;
  min-height: 1.5em;
  animation: fadeIn 0.5s ease;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(15, 23, 42, 0.3);
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

/* Transitions */
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.5s ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(20px); }
.fade-up-leave-to { opacity: 0; transform: translateY(-20px); }
</style>
