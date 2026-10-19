<script setup>
import { ref } from 'vue'
import keycloak from '../auth/keycloak'

const name = ref('')
const cuisine = ref('')
const city = ref('')
const seats = ref(1)
const createdRestaurant = ref(null)
const restaurantError = ref('')

async function createRestaurant() {
  const restaurant = {
    name: name.value,
    cuisine: cuisine.value,
    city: city.value,
    seats: seats.value
  }

  restaurantError.value = ''
  createdRestaurant.value = null

  try {
    await keycloak.updateToken(30)

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/restaurants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keycloak.token}`
          },
          body: JSON.stringify(restaurant)
        }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    createdRestaurant.value = await response.json()


  } catch (error) {
    console.error('Kunde inte skapa restaurangen:', error)

    switch (error.message) {
      case 'HTTP 400':
        restaurantError.value = 'Kontrollera restaurangens uppgifter.'
        break

      case 'HTTP 401':
        restaurantError.value = 'Din inloggning är inte giltig. Logga in igen.'
        break

      case 'HTTP 403':
        restaurantError.value = 'Du saknar behörighet att skapa restauranger.'
        break

      case 'HTTP 409':
        restaurantError.value = 'Restaurangen kunde inte skapas på grund av en konflikt.'
        break

      case 'HTTP 422':
        restaurantError.value = 'Servern kunde inte behandla restaurangens uppgifter.'
        break

      default:
        restaurantError.value = 'Det gick inte att skapa restaurangen. Försök igen.'
    }
  }
}

</script>

<template>
  <main>
    <h1>Administrera restauranger</h1>

    <p>
      Inloggad som:
      {{ keycloak.tokenParsed?.preferred_username }}
    </p>

    <p v-if="keycloak.hasRealmRole('ADMIN')">
      Du har behörighet att skapa restauranger.
    </p>

    <p v-else>
      Du saknar behörighet att administrera restauranger.
    </p>

    <form
        v-if="keycloak.hasRealmRole('ADMIN')"
        @submit.prevent="createRestaurant"
    >
      <div>
        <label for="name">Restaurangens namn</label>
        <input id="name" v-model="name" type="text" required />
      </div>

      <div>
        <label for="cuisine">Typ av kök</label>
        <input id="cuisine" v-model="cuisine" type="text" required />
      </div>

      <div>
        <label for="city">Stad</label>
        <input id="city" v-model="city" type="text" required />
      </div>

      <div>
        <label for="seats">Antal sittplatser</label>
        <input
            id="seats"
            v-model.number="seats"
            type="number"
            min="1"
            required
        />
      </div>

      <button type="submit">Skapa restaurang</button>
    </form>

    <p v-if="restaurantError" role="alert">
      {{ restaurantError }}
    </p>

    <div v-if="createdRestaurant">
      <h2>Restaurangen har skapats!</h2>

      <p>Namn: {{ createdRestaurant.name }}</p>
      <p>Kök: {{ createdRestaurant.cuisine }}</p>
      <p>Stad: {{ createdRestaurant.city }}</p>
      <p>Antal sittplatser: {{ createdRestaurant.seats }}</p>
    </div>

  </main>
</template>
