<script setup>
import { ref, onMounted } from 'vue'

const restaurants = ref([])
const loading = ref(true)
const error = ref(null)

const apiUrl = import.meta.env.VITE_API_URL

async function loadRestaurants() {
  try {
    const response = await fetch(`${apiUrl}/restaurants?page=0&size=10`)  // fetch() – anropar mitt Spring Boot-API

    if (!response.ok) {
      throw new Error(`HTTP-fel: ${response.status}`)
    }

    const data = await response.json() // await innebär att funktionen väntar på resultatet från den asynkrona operationen innan den fortsätter.
    restaurants.value = data.items     // response.json() – läser svaret
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadRestaurants)  // onMounted() – när komponenten har monterats. Vue anropar loadRestaurants() när komponenten har monterats i webbsidan utan att något klick behövs
</script>

<template>
  <section>
    <h2>Restauranger</h2>

    <p v-if="loading">Hämtar restauranger...</p>

    <p v-else-if="error">Fel: {{ error }}</p>

    <div v-else class="restaurant-list">
      <article
          v-for="restaurant in restaurants"
          :key="restaurant.id"
          class="restaurant-card"
      >
        <h3>{{ restaurant.name }}</h3>

        <p>{{ restaurant.city }} – {{ restaurant.cuisine }}</p>

        <RouterLink :to="`/restaurants/${restaurant.id}`">
          Visa detaljer
        </RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.restaurant-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.restaurant-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
}

.restaurant-card h3 {
  margin-top: 0;
  color: #222;
}
</style>