
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const restaurant = ref(null)
const loading = ref(true)
const error = ref(null)

const apiUrl = import.meta.env.VITE_API_URL

async function loadRestaurant() {
  try {
    const response = await fetch(
        `${apiUrl}/restaurants/${route.params.id}`,
        {
          headers: {
            'API-Version': '1',
          },
        },
    )

    if (!response.ok) {
      throw new Error(`HTTP-fel: ${response.status}`)
    }

    restaurant.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadRestaurant)
</script>

<template>
  <section>
    <p v-if="loading">Hämtar restaurang...</p>

    <p v-else-if="error">Fel: {{ error }}</p>

    <div v-else-if="restaurant">
      <h2>{{ restaurant.name }}</h2>

      <p>Stad: {{ restaurant.city }}</p>
      <p>Kök: {{ restaurant.cuisine }}</p>
      <p>Antal platser: {{ restaurant.seats }}</p>

      <RouterLink to="/restaurants">
        Tillbaka till restauranger
      </RouterLink>
    </div>
  </section>
</template>
