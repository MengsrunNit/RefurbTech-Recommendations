<script setup>
import { ref } from 'vue'
// Simple app shell — navigation is handled by vue-router
import Chatbot from './components/Chatbot.vue'

const isMenuOpen = ref(false)
</script>

<template>
  <div id="app" class="app-shell">
    <header class="header">
      <div class="brand">
        <router-link to="/" class="brand-link">
          <h1>RefurbishTech</h1>
        </router-link>
        <small>Refurbished devices made simple</small>
      </div>
      
      <!-- Mobile Menu Toggle -->
      <button class="menu-toggle" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <!-- Navigation -->
      <nav class="nav" :class="{ 'is-open': isMenuOpen }">
        <router-link to="/" class="nav-link" @click="isMenuOpen = false">Home</router-link>
        <router-link to="/survey" class="nav-link" @click="isMenuOpen = false">Find My Phone</router-link>
        <router-link to="/chat" class="nav-link" @click="isMenuOpen = false">AI Chat</router-link>
        <router-link to="/phone" class="nav-link" @click="isMenuOpen = false">Phone</router-link>
        <router-link to="/price-track" class="nav-link" @click="isMenuOpen = false"
          >Price Track</router-link
        >
        <router-link to="/comparison" class="nav-link" @click="isMenuOpen = false">Comparison</router-link>
        <div class="nav-divider"></div>
        <router-link to="/login" class="nav-link login-btn" @click="isMenuOpen = false"
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
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(11, 18, 32, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.brand-link {
  text-decoration: none;
}

.brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: opacity 0.2s;
}

.brand h1:hover {
  opacity: 0.9;
}

.brand small {
  display: block;
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 2px;
}

/* Navigation Styles */
.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  color: var(--muted);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.router-link-active {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2);
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 0.5rem;
}

.login-btn {
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
  color: #0f172a !important;
  font-weight: 700;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(34, 211, 238, 0.2);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 211, 238, 0.4);
  filter: brightness(1.1);
}

.login-btn.router-link-active {
  background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

/* Mobile Menu Toggle */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 101;
}
.menu-toggle .bar {
  width: 100%;
  height: 2px;
  background-color: var(--text);
  border-radius: 3px;
  transition: 0.3s;
}

/* Responsive Styles */
@media (max-width: 900px) {
  .header {
    padding: 1rem 1.5rem;
  }
  
  .menu-toggle {
    display: flex;
  }

  .nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    flex-direction: column;
    align-items: flex-start;
    background: rgba(11, 18, 32, 0.98);
    backdrop-filter: blur(20px);
    padding: 5rem 2rem 2rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -10px 0 40px rgba(0,0,0,0.5);
    z-index: 99;
  }

  .nav.is-open {
    transform: translateX(0);
  }

  .nav-link {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border-radius: 12px;
  }

  .nav-divider {
    display: none;
  }

  .login-btn {
    margin-top: auto;
    text-align: center;
    width: 100%;
  }
}

.main {
  flex: 1;
  padding: 2rem;
}
.footer {
  padding: 1rem 2rem;
  background: var(--bg-soft);
  color: var(--muted);
  text-align: center;
  border-top: 1px solid rgba(96, 165, 250, 0.12);
}

@media (max-width: 640px) {
  .main {
    padding: 1rem;
  }
}
</style>
