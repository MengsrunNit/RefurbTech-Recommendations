<template>
  <div class="page phone">
    <div class="controls">
      <input v-model="q" placeholder="Search phones (brand or model)" />
      <select v-model="sort">
        <option value="popular">Most popular</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
      </select>
      <div class="spacer"></div>
      <button @click="showFavs = !showFavs">{{ showFavs ? 'Show All' : 'Show Favorites' }}</button>
    </div>

    <div class="grid">
      <ProductCard
        v-for="p in visible"
        :key="p.id"
        :product="p"
        :favs="favs"
        @open="openProduct"
        @toggle-fav="toggleFav"
      />
    </div>

    <div v-if="visible.length===0" class="empty">No phones found.</div>

    <ProductModal v-if="active" :product="active" @close="active=null" @add-compare="addToCompare" />

    <div class="compare-bar" v-if="compare.length">
      <small>Compare ({{ compare.length }})</small>
      <div class="compare-list">
        <div v-for="c in compare" :key="c.id" class="compare-item">
          {{ c.brand }} {{ c.model }}
        </div>
      </div>
      <button @click="openCompare">Open comparison</button>
      <button @click="clearCompare">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import ProductModal from '../components/ProductModal.vue'
import phonesData from '../data/phones.json'

const q = ref('')
const sort = ref('popular')
const showFavs = ref(false)
const favs = ref(JSON.parse(localStorage.getItem('favs')||'[]'))
const active = ref(null)
const compare = ref([])

const list = ref([...phonesData])

function toggleFav(id){
  const idx = favs.value.indexOf(id)
  if(idx>=0) favs.value.splice(idx,1)
  else favs.value.push(id)
  localStorage.setItem('favs', JSON.stringify(favs.value))
}

function openProduct(p){ active.value = p }

function addToCompare(p){
  if(!compare.value.find(x=>x.id===p.id)) compare.value.push(p)
}

function openCompare(){
  alert('Compare: ' + compare.value.map(p=>p.model).join(', '))
}

function clearCompare(){ compare.value = [] }

const visible = computed(()=>{
  let out = list.value.filter(p=>{
    const matchesQ = (p.brand + ' ' + p.model).toLowerCase().includes(q.value.toLowerCase())
    return matchesQ && (!showFavs.value || favs.value.includes(p.id))
  })
  if(sort.value==='price-asc') out.sort((a,b)=>a.price-b.price)
  if(sort.value==='price-desc') out.sort((a,b)=>b.price-a.price)
  return out
})

onMounted(()=>{
  // placeholder for eventual API fetch
})
</script>

<style scoped>
.controls{display:flex;gap:0.5rem;align-items:center;margin-bottom:1rem}
.controls input{flex:1;padding:0.6rem;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit}
.controls select{padding:0.5rem;border-radius:8px}
.controls .spacer{flex:1}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.empty{padding:2rem;color:#94a3b8;text-align:center}
.compare-bar{position:sticky;bottom:12px;left:0;right:0;margin-top:1rem;background:linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:0.6rem;border-radius:8px;display:flex;gap:1rem;align-items:center}
.compare-list{display:flex;gap:0.5rem}
.compare-item{background:rgba(255,255,255,0.03);padding:0.3rem 0.5rem;border-radius:6px}
</style>
