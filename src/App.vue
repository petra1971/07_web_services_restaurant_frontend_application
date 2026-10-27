<!--
App.vue är vår applikations rotkomponent.
En Vue-komponent kan innehålla tre delar:
<script setup>	JavaScript-logik och importer
<template>	HTML-strukturen som visas
<style>	CSS som styr utseendet
RouterLink fungerar ungefär som en HTML-länk, men låter Vue Router byta sida utan att webbläsaren behöver ladda om hela applikationen.
-->

<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="app">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  width: 100%;
}

.main-content {
  width: 100%;
}
</style>
