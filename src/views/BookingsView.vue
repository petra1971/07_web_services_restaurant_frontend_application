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
        `${import.meta.env.VITE_API_URL}/restaurants`,
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
  <main class="booking-page">
    <div class="booking-container">

      <div class="booking-heading">
        <p class="eyebrow">SKÄRGÅRDEN · GÖTEBORG</p>
        <h1>Boka bord</h1>
        <p>
          Välkommen att skicka din bokningsförfrågan.
          Vi ser fram emot ditt besök!
        </p>
      </div>

      <div class="booking-panel">
        <form @submit.prevent="createBooking">

          <div class="form-group">
            <label for="restaurant">Restaurang</label>
            <select
                id="restaurant"
                v-model="selectedRestaurantId"
                required
            >
              <option value="" disabled>
                Välj restaurang
              </option>

              <option
                  v-for="restaurant in restaurants"
                  :key="restaurant.id"
                  :value="restaurant.id"
              >
                {{ restaurant.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="arrivalTime">Datum och tid</label>
            <input
                id="arrivalTime"
                v-model="arrivalTime"
                type="datetime-local"
                required
            />
          </div>

          <div class="form-group">
            <label for="partySize">Antal gäster</label>
            <input
                id="partySize"
                v-model.number="partySize"
                type="number"
                min="1"
                required
            />
          </div>

          <div class="form-group">
            <label for="guestName">Namn</label>
            <input
                id="guestName"
                v-model="guestName"
                type="text"
                placeholder="Ditt namn"
                autocomplete="name"
                required
            />
          </div>

          <div class="form-group">
            <label for="guestEmail">E-postadress</label>
            <input
                id="guestEmail"
                v-model="guestEmail"
                type="email"
                placeholder="namn@exempel.se"
                autocomplete="email"
                required
            />
          </div>

          <button
              type="submit"
              class="submit-button"
              :disabled="isSubmitting"
          >
            {{
              isSubmitting
                  ? 'Skickar bokningsförfrågan...'
                  : 'Skicka bokningsförfrågan'
            }}
          </button>

          <p class="booking-note">
            Din bokning är inte bekräftad förrän
            restaurangen har godkänt den.
          </p>

        </form>

        <p
            v-if="bookingError"
            class="booking-error"
            role="alert"
        >
          {{ bookingError }}
        </p>

        <div
            v-if="createdBooking"
            class="booking-success"
            role="status"
        >
          <h2>Din bokningsförfrågan har skickats!</h2>

          <p>
            Restaurang: {{ bookedRestaurantName }}
          </p>

          <p>
            Ankomst:
            {{
              new Date(
                  createdBooking.arrivalTime
              ).toLocaleString('sv-SE', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })
            }}
          </p>

          <p>
            Antal gäster: {{ createdBooking.partySize }}
          </p>

          <p>Status: Väntar på bekräftelse</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.booking-page {
  min-height: 100vh;
  padding: 80px 24px 110px;
  background: #f8f6f1;
  color: #252c27;
}

.booking-container {
  max-width: 660px;
  margin: 0 auto;
}

.booking-heading {
  margin-bottom: 40px;
  text-align: center;
}

.eyebrow {
  margin-bottom: 14px;
  color: #607766;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.booking-heading h1 {
  margin-bottom: 16px;
  color: #263f35;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 5vw, 3.8rem);
  font-weight: 400;
}

.booking-heading > p:last-child {
  color: #56645b;
  line-height: 1.7;
}

.booking-panel {
  padding: 42px;
  border: 1px solid #e9e1d3;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 35px rgba(38, 63, 53, 0.06);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 23px;
}

.form-group label {
  color: #263f35;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border: 1px solid #d6d9d1;
  border-radius: 6px;
  background: #fff;
  color: #252c27;
  font: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: 2px solid #607766;
  outline-offset: 2px;
}

.submit-button {
  width: 100%;
  min-height: 54px;
  margin-top: 12px;
  padding: 14px 20px;
  border: none;
  border-radius: 6px;
  background: #263f35;
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background: #365749;
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.booking-note {
  margin-top: 18px;
  color: #607766;
  font-size: 0.85rem;
  line-height: 1.6;
  text-align: center;
}

.booking-error {
  margin-top: 24px;
  padding: 16px;
  border-radius: 6px;
  background: #fff0ed;
  color: #9c3025;
}

.booking-success {
  margin-top: 30px;
  padding: 24px;
  border: 1px solid #a8b6a1;
  border-radius: 8px;
  background: #f1f5ee;
}

.booking-success h2 {
  margin-bottom: 18px;
  color: #263f35;
  font-family: Georgia, serif;
  font-size: 1.6rem;
}

.booking-success p {
  margin: 10px 0;
}

@media (max-width: 600px) {
  .booking-page {
    padding: 50px 16px 70px;
  }

  .booking-panel {
    padding: 25px 20px;
  }
}
</style>
