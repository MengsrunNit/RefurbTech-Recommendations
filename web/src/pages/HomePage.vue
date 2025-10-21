<template>
  <div class="page home">
    <div class="hero">
      <h2>Welcome to RefurbishTech</h2>
      <p>
        Your hub for refurbished tech — find devices, track prices, and compare
        deals.
      </p>
      
      <div class="cta-section">
        <router-link to="/survey" class="cta-button">
          🔍 Find My Perfect Phone
        </router-link>
        <p class="cta-subtitle">
          Take our 2-minute survey and get personalized recommendations
        </p>
      </div>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>🎯 Personalized Recommendations</h3>
        <p>Answer a few questions and get phones tailored to your needs and budget</p>
      </div>
      <div class="feature">
        <h3>📊 Compare Specs</h3>
        <p>Side-by-side comparisons of features that matter to you</p>
      </div>
      <div class="feature">
        <h3>💰 Track Prices</h3>
        <p>Monitor price changes and get alerts for the best deals</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Home page logic (if needed)
</script>

<style scoped>
.home {
  padding: 2rem 1rem;
  text-align: center;
}

.hero {
  max-width: 600px;
  margin: 0 auto 3rem;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero > p {
  font-size: 1.1rem;
  color: var(--muted);
  margin-bottom: 2rem;
}

.cta-section {
  margin: 2rem 0;
}

.cta-button {
  display: inline-block;
  background: linear-gradient(90deg, var(--brand-2), var(--brand-1));
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(96, 165, 250, 0.4);
}

.cta-subtitle {
  margin-top: 0.5rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.feature {
  background: rgba(14, 21, 38, 0.6);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.15);
  transition: transform 0.2s, border-color 0.2s;
}

.feature:hover {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.3);
}

.feature h3 {
  margin: 0 0 0.5rem;
  color: var(--brand-2);
  font-size: 1.1rem;
}

.feature p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .home {
    padding: 1rem;
  }
  
  .hero h2 {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .cta-button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
