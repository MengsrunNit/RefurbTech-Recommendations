<template>
  <article class="card" @click="$emit('open', product)">
    <div class="thumb">
      <img :src="product.image" :alt="product.model" />
    </div>
    <div class="card-body">
      <div class="title-row">
        <h3>{{ product.brand }} {{ product.model }}</h3>
        <button class="fav" @click.stop="$emit('toggle-fav', product.id)">
          <span v-if="isFav">★</span>
          <span v-else>☆</span>
        </button>
      </div>
      <p class="meta">{{ product.condition }} • {{ product.year }}</p>
      <div class="price-row">
        <div class="price">${{ product.price }}</div>
        <div class="rating">⭐ {{ product.rating }}</div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ product: Object, favs: Array })
const isFav = computed(() => (props.favs || []).includes(props.product.id))
</script>

<style scoped>
.card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:12px;padding:0;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;transition:transform .15s ease, box-shadow .15s ease}
.card:hover{transform:translateY(-6px);box-shadow:0 8px 30px rgba(2,6,23,0.6)}
.thumb{height:160px;overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.card-body{padding:0.8rem}
.title-row{display:flex;justify-content:space-between;align-items:center}
.fav{background:transparent;border:0;color:#ffd166;font-size:1.1rem}
.meta{color:#94a3b8;font-size:0.9rem;margin:0.3rem 0}
.price-row{display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem}
.price{font-weight:700}
.rating{color:#fbbf24;font-size:0.9rem}
</style>
