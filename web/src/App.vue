<script setup>
// Simple app shell — navigation is handled by vue-router
import Chatbot from './components/Chatbot.vue'
</script>

<template>
  <div id="app" class="app-shell">
    <header class="header">
      <div class="brand">
        <h1>RefurbishTech</h1>
        <small>Refurbished devices made simple</small>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/survey" class="nav-link">Find My Phone</router-link>
        <router-link to="/phone" class="nav-link">Phone</router-link>
        <router-link to="/price-track" class="nav-link"
          >Price Track</router-link
        >
        <router-link to="/comparison" class="nav-link">Comparison</router-link>
        <router-link to="/login" class="nav-link login-link"
          >Log in</router-link
        >
      </nav>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <small>© RefurbishTech</small>
    </footer>

    <!-- Floating chatbot widget -->
    <Chatbot />
  </div>
</template>

<style>
:root {
  --bg: #0b1220;
  --bg-soft: #0e1526;
  --text: #e6edf7;
  --muted: #9fb0c3;
  --brand-1: #22d3ee;
  --brand-2: #60a5fa;
}

body,
#app {
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
  color: var(--text);
  background: radial-gradient(
      1200px 600px at 10% -10%,
      rgba(96, 165, 250, 0.12),
      transparent
    ),
    radial-gradient(
      900px 500px at 100% 0%,
      rgba(34, 211, 238, 0.1),
      transparent
    ),
    var(--bg);
}
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 2rem;
  background: linear-gradient(
    180deg,
    rgba(14, 21, 38, 0.9),
    rgba(14, 21, 38, 0.8)
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(96, 165, 250, 0.15);
}
.brand h1 {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: 0.2px;
}
.brand small {
  display: block;
  color: var(--muted);
}
.nav {
  display: flex;
  gap: 0.5rem;
}
.nav-link {
  color: var(--muted);
  text-decoration: none;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
}
.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.nav-link.router-link-active {
  background: linear-gradient(
    90deg,
    rgba(34, 211, 238, 0.18),
    rgba(96, 165, 250, 0.18)
  );
  color: #fff;
  border: 1px solid rgba(96, 165, 250, 0.25);
}
.login-link {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.main {
  flex: 1;
  padding: 2rem;
}
.footer {
  padding: 1rem 2rem;
  background: var(--bg-soft);
  color: var(--muted);
  border-top: 1px solid rgba(96, 165, 250, 0.12);
}

@media (max-width: 640px) {
  .main {
    padding: 1rem;
  }
}
</style>
