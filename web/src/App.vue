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
:root{
  --bg-0:#071021;
  --bg-1:#071627;
  --muted:#94a3b8;
  --accent:#00b894;
  --card:rgba(255,255,255,0.02);
}
html,body,#app{height:100%;margin:0}
body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;background:linear-gradient(180deg,var(--bg-0),var(--bg-1));color:#e6eef8}
.app-shell{min-height:100vh;display:flex;flex-direction:column}
.header{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.03);backdrop-filter:blur(6px);}
.brand h1{margin:0;color:var(--accent);font-size:1.2rem}
.brand small{display:block;color:var(--muted);font-size:0.85rem}
.nav{display:flex;gap:0.5rem;align-items:center}
.nav-link{color:var(--muted);text-decoration:none;padding:0.45rem 0.7rem;border-radius:8px}
.nav-link.router-link-active{background:rgba(255,255,255,0.03);color:#fff}
.login-link{border:1px solid rgba(255,255,255,0.06)}
.main{flex:1;padding:2rem;max-width:1100px;margin:0 auto;width:100%}
.footer{padding:1rem;text-align:center;color:var(--muted)}

/* small screens */
@media (max-width:640px){
  .nav{gap:0.25rem}
  .brand h1{font-size:1rem}
  .main{padding:1rem}
}
</style>
