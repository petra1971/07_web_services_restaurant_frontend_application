<!--
App.vue är vår applikations rotkomponent.
En Vue-komponent kan innehålla tre delar:
<script setup>	JavaScript-logik och importer
<template>	HTML-strukturen som visas
<style>	CSS som styr utseendet
RouterLink fungerar ungefär som en HTML-länk, men låter Vue Router byta sida utan att webbläsaren behöver ladda om hela applikationen.
-->

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header>
      <h1>Restaurant Booking</h1>

      <nav>
        <RouterLink to="/">Hem</RouterLink>
        <RouterLink to="/restaurants">Restauranger</RouterLink>
        <RouterLink to="/bookings">Bokningar</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  color: #2563eb;
  text-decoration: none;
}

nav a.router-link-active {
  font-weight: bold;
}
</style>
