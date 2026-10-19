<script setup>
import { ref, onMounted } from 'vue'
import keycloak from '../auth/keycloak'

const guestName = ref('')
const guestEmail = ref('')
const arrivalTime = ref('')
const partySize = ref(2)
const restaurants = ref([])
const selectedRestaurantId = ref('')
const createdBooking = ref(null)
const bookedRestaurantName = ref('')
const idempotencyKey = ref(crypto.randomUUID()) // crypto.randomUUID() skapar en unik nyckel
const bookingJsonForKey = ref(null)
const bookingError = ref('')
const isSubmitting = ref(false)

async function loadRestaurants() {

  console.log('loadRestaurants() har startat')

  try {
    const response = await fetch(
        'https://07javawebservicesassignment1restaurantapi-production.up.railway.app/restaurants',
        {
          headers: {
            'API-Version': '1'
          }
        }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log('Restauranger från API:', data)

    restaurants.value = data.items ?? []

  } catch (error) {
    console.error('Kunde inte hämta restauranger:', error)
  }
}
onMounted(loadRestaurants)


async function createBooking() {
  if (isSubmitting.value) {
    return
  }

  const booking = {
    guestName: guestName.value,
    guestEmail: guestEmail.value,
    arrivalTime: arrivalTime.value,
    partySize: partySize.value,
    restaurantId: Number(selectedRestaurantId.value)
  }
  console.log('Bokning:', booking)

  const bookingJson = JSON.stringify(booking)

  if (
      bookingJsonForKey.value !== null &&
      bookingJsonForKey.value !== bookingJson
  ) {
    idempotencyKey.value = crypto.randomUUID()
  }

  bookingJsonForKey.value = bookingJson

  if (!keycloak.authenticated) {
    await keycloak.login()
    return
  }

  bookingError.value = ''
  isSubmitting.value = true

  try {
    await keycloak.updateToken(30)

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings`, // Vite läser variabler som börjar med VITE_ och gör dem tillgängliga i frontendens JavaScript genom import.meta.env.
       {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keycloak.token}`,
            'Idempotency-Key': idempotencyKey.value
          },
          body: JSON.stringify(booking)
        }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    createdBooking.value = await response.json()

    // Bokningen har skapats eller ett tidigare lyckat svar har återspelats.
    // Nästa bokning ska få en ny idempotency-nyckel.
    idempotencyKey.value = crypto.randomUUID()
    bookingJsonForKey.value = null

    const restaurant = restaurants.value.find(
        r => r.id === Number(selectedRestaurantId.value)
    )

      bookedRestaurantName.value = restaurant?.name ?? ''

      console.log('Skapad bokning:', createdBooking.value)

  } catch (error) {
    console.error('Bokningen misslyckades:', error)

    switch (error.message) {
      case 'HTTP 400':
        bookingError.value = 'Kontrollera bokningsuppgifterna.'
        break

      case 'HTTP 401':
        bookingError.value = 'Din inloggning är inte giltig. Logga in igen.'
        break

      case 'HTTP 403':
        bookingError.value = 'Du saknar behörighet att skapa bokningar.'
        break

      case 'HTTP 409':
        bookingError.value = 'Bokningen kunde inte genomföras på grund av en konflikt.'
        break

      case 'HTTP 422':
        bookingError.value = 'Bokningsuppgifterna har ändrats. Försök igen.'
        break

      default:
        bookingError.value = 'Det gick inte att skapa bokningen. Försök igen.'
    }
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <main>
    <h1>Skapa bokning</h1>

    <form @submit.prevent="createBooking">
      <div>
        <label for="restaurant">Restaurang</label>

        <select
            id="restaurant"
            v-model="selectedRestaurantId"
            required
        >
          <option value="" disabled>Välj restaurang</option>
          <option
              v-for="restaurant in restaurants"
              :key="restaurant.id"
              :value="restaurant.id"
          >
            {{ restaurant.name }}
          </option>
        </select>
      </div>
      <div>
        <label for="guestName">Namn</label>
        <input
            id="guestName"
            v-model="guestName"
            type="text"
            required
        />
      </div>
      <div>
        <label for="guestEmail">E-postadress</label>
        <input
            id="guestEmail"
            v-model="guestEmail"
            type="email"
            required
        />
      </div>
      <div>
        <label for="arrivalTime">Ankomsttid</label>
        <input
            id="arrivalTime"
            v-model="arrivalTime"
            type="datetime-local"
            required
        />
      </div>
      <div>
        <label for="partySize">Antal gäster</label>
        <input
            id="partySize"
            v-model.number="partySize"
            type="number"
            min="1"
            required
        />
      </div>
      <button type="submit">Skapa bokning</button>
    </form>
    <p v-if="bookingError" role="alert">
      {{ bookingError }}
    </p>

    <div v-if="createdBooking">
      <h2>Din bokningsförfrågan har skickats!</h2>

      <p>Restaurang: {{ bookedRestaurantName }}</p>

      <p>
        Ankomst:
        {{ new Date(createdBooking.arrivalTime).toLocaleString('sv-SE', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }) }}
      </p>

      <p>Antal gäster: {{ createdBooking.partySize }}</p>

      <p>Status: Väntar på bekräftelse</p>
    </div>
  </main>
</template>

