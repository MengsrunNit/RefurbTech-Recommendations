<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" @click="$emit('close')">✕</button>
      <div class="modal-grid">
        <div class="img"><img :src="product.image" :alt="product.model" /></div>
        <div class="info">
          <h2>{{ product.brand }} {{ product.model }}</h2>
          <p class="meta">{{ product.condition }} • {{ product.year }}</p>
          <p class="price">${{ product.price }}</p>
          <p class="rating">⭐ {{ product.rating }}</p>
          <h4>Specs</h4>
          <ul>
            <li v-for="(v, k) in product.specs" :key="k">{{ k }}: {{ v }}</li>
          </ul>
          <div class="actions">
            <button @click="$emit('add-compare', product)">
              Add to compare
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ product: Object });
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 60;
}
.modal {
  background: #071127;
  border-radius: 12px;
  padding: 1rem;
  max-width: 900px;
  width: 100%;
  color: #e6eef8;
}
.close {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: transparent;
  border: 0;
  color: #94a3b8;
  font-size: 1.2rem;
}
.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.img img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: 8px;
}
.info h2 {
  margin: 0;
}
.price {
  font-size: 1.3rem;
  font-weight: 700;
}
.actions {
  margin-top: 1rem;
}
.actions button {
  background: #00b894;
  border: 0;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  color: #012;
  cursor: pointer;
}
</style>
