<template>
  <div class="page login">
    <h2>Log in</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <div>
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <button type="submit">Log in</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");

function onSubmit() {
  // placeholder login action
  alert(`Logging in with ${email.value}`);
}
</script>

<style scoped>
.login {
  padding: 1rem;
}
form div {
  margin-bottom: 0.5rem;
}
label {
  display: block;
  font-size: 0.9rem;
}
input {
  width: 100%;
  padding: 0.4rem;
  box-sizing: border-box;
}
</style>
