<script setup>
// Simple app shell — navigation is handled by vue-router
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
  </div>
</template>

<style>
body,
#app {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
    Arial;
}
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #0f172a;
  color: white;
}
.brand h1 {
  margin: 0;
  font-size: 1.25rem;
}
.brand small {
  display: block;
  color: #cbd5e1;
}
.nav {
  display: flex;
  gap: 1rem;
}
.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
}
.nav-link.router-link-active {
  background: #1e293b;
  color: #fff;
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
  background: #f8fafc;
  text-align: center;
}
</style>
