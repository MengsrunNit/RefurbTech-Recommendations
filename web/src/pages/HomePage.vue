<template>
  <main class="home">
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Refurbished phones, minus the guesswork</p>
        <h1>Refurbished tech you can actually trust.</h1>
        <p class="subtitle">
          RefurbishTech helps you find the right phone at the right price by
          comparing devices, specs, and offers from trusted sellers — in one
          place.
        </p>

        <div class="hero-actions">
          <router-link to="/survey" class="btn btn-primary">
            Find my phone
          </router-link>
          <router-link to="/comparison" class="btn btn-ghost">
            Browse & compare
          </router-link>
        </div>

        <p class="confidence-note">
          No spam. No affiliate fluff. Just clear recommendations.
        </p>
      </div>

      <div class="hero-panel">
        <div class="panel-header">
          <span class="panel-title">Example match</span>
          <span class="panel-pill">Based on typical answers</span>
        </div>

        <div class="panel-body">
          <div class="match-row">
            <div>
              <p class="match-label">Best value pick</p>
              <p class="match-name">iPhone 13 · 128GB</p>
              <p class="match-meta">Excellent condition · 88–92% battery</p>
            </div>
            <div class="match-score">
              <span class="match-score-label">Match</span>
              <span class="match-score-value">92%</span>
            </div>
          </div>

          <div class="match-tags">
            <span class="tag">Great camera</span>
            <span class="tag">All-day battery</span>
            <span class="tag">Under $450</span>
          </div>

          <div class="match-pricing">
            <div>
              <span class="price-label">Typical new</span>
              <span class="price-old">$699</span>
            </div>
            <div>
              <span class="price-label">Refurb offer</span>
              <span class="price-new">$439</span>
            </div>
          </div>
        </div>

        <p class="panel-footer">
          Your real recommendations will use your budget, usage, and preferred
          brands.
        </p>
      </div>
    </section>

    <section class="features">
      <header class="section-header">
        <h2>Why shop with RefurbishTech?</h2>
        <p>
          A focused toolkit to help you buy refurbished confidently — without
          reading hours of reviews.
        </p>
      </header>

      <div class="feature-grid">
        <article class="feature">
          <h3>Clear, honest recommendations</h3>
          <p>
            Tell us how you use your phone and your budget. We highlight devices
            that actually fit, not just the cheapest.
          </p>
        </article>

        <article class="feature">
          <h3>Simple spec comparisons</h3>
          <p>
            Compare options side by side with plain-language explanations
            instead of spec-sheet jargon.
          </p>
        </article>

        <article class="feature">
          <h3>Price tracking in one place</h3>
          <p>
            Keep an eye on price movements across multiple sellers and spot real
            deals quickly.
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
// Home page logic (if needed)
</script>

<style scoped>
.home {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

/* HERO */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: center;
}

.hero-text h1 {
  font-size: clamp(2.2rem, 3vw + 1rem, 3rem);
  line-height: 1.1;
  margin-bottom: 1rem;
}

.eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--muted);
  margin-bottom: 0.7rem;
}

.subtitle {
  color: var(--muted);
  font-size: 1rem;
  max-width: 34rem;
  margin-bottom: 1.8rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease,
    transform 0.12s ease;
}

.btn-primary {
  background: var(--brand-1);
  color: #ffffff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.btn-ghost {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.4);
  color: inherit;
}

.btn-ghost:hover {
  border-color: var(--brand-1);
}

.confidence-note {
  font-size: 0.85rem;
  color: var(--muted);
}

/* HERO PANEL (right card) */

.hero-panel {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 1.4rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.02); /* works on both light/dark */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.panel-pill {
  font-size: 0.75rem;
  color: var(--muted);
}

.panel-body {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 1rem;
}

.match-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.match-label {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 0.2rem;
}

.match-name {
  font-size: 1rem;
  font-weight: 600;
}

.match-meta {
  font-size: 0.8rem;
  color: var(--muted);
}

.match-score {
  text-align: right;
}

.match-score-label {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
}

.match-score-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.match-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.match-pricing {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
}

.price-label {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.1rem;
}

.price-old {
  text-decoration: line-through;
  color: var(--muted);
}

.price-new {
  font-weight: 600;
}

.panel-footer {
  font-size: 0.8rem;
  color: var(--muted);
}

/* FEATURES */

.features {
  margin-top: 4rem;
}

.section-header {
  max-width: 34rem;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: var(--muted);
  font-size: 0.95rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.feature {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 1.3rem 1.2rem;
}

.feature h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.feature p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}

/* RESPONSIVE */

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    order: -1;
  }
}

@media (max-width: 640px) {
  .home {
    padding: 2.2rem 1.25rem 3rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-panel {
    padding: 1.1rem 1rem;
  }

  .panel-body {
    padding: 0.9rem;
  }
}
</style>
