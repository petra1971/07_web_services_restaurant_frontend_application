
<script setup>
import { ref, onMounted } from 'vue'
import keycloak from '../auth/keycloak'

// Formulär för att skapa restaurang
const name = ref('')
const cuisine = ref('')
const city = ref('')
const seats = ref(1)

const createdRestaurant = ref(null)
const restaurantError = ref('')

// Lista med befintliga restauranger
const restaurants = ref([])
const loadingRestaurants = ref(false)
const restaurantsError = ref('')

const isCreating = ref(false)

const apiUrl = import.meta.env.VITE_API_URL

// Hämta restauranger från backend
async function loadRestaurants() {
  if (!keycloak.hasRealmRole('ADMIN')) {
    return
  }

  loadingRestaurants.value = true
  restaurantsError.value = ''

  try {
    const response = await fetch(
        `${apiUrl}/restaurants?page=0&size=100`,
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

    restaurants.value = data.items ?? []

  } catch (error) {
    console.error(
        'Kunde inte hämta restauranger:',
        error
    )

    restaurantsError.value =
        'Det gick inte att hämta restauranglistan.'

  } finally {
    loadingRestaurants.value = false
  }
}

// Körs när administrationssidan öppnas
onMounted(loadRestaurants)

// Skapa en ny restaurang
async function createRestaurant() {
  if (isCreating.value) {
    return
  }

  const restaurant = {
    name: name.value,
    cuisine: cuisine.value,
    city: city.value,
    seats: seats.value
  }

  restaurantError.value = ''
  createdRestaurant.value = null
  isCreating.value = true

  try {
    await keycloak.updateToken(30)

    const response = await fetch(
        `${apiUrl}/restaurants`,
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

    // Töm formuläret efter lyckad registrering
    name.value = ''
    cuisine.value = ''
    city.value = ''
    seats.value = 1

    // Hämta listan igen så att den nya
    // restaurangen visas direkt
    await loadRestaurants()

  } catch (error) {
    console.error(
        'Kunde inte skapa restaurangen:',
        error
    )

    switch (error.message) {
      case 'HTTP 400':
        restaurantError.value =
            'Kontrollera restaurangens uppgifter.'
        break

      case 'HTTP 401':
        restaurantError.value =
            'Din inloggning är inte giltig. Logga in igen.'
        break

      case 'HTTP 403':
        restaurantError.value =
            'Du saknar behörighet att skapa restauranger.'
        break

      case 'HTTP 409':
        restaurantError.value =
            'Restaurangen kunde inte skapas på grund av en konflikt.'
        break

      case 'HTTP 422':
        restaurantError.value =
            'Servern kunde inte behandla restaurangens uppgifter.'
        break

      default:
        restaurantError.value =
            'Det gick inte att skapa restaurangen. Försök igen.'
    }

  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <main class="admin-page">
    <div class="admin-container">

      <header class="admin-heading">
        <p class="eyebrow">
          SKÄRGÅRDEN · ADMINISTRATION
        </p>

        <h1>Administrera restauranger</h1>

        <p>
          Inloggad som:
          {{ keycloak.tokenParsed?.preferred_username }}
        </p>
      </header>

      <div v-if="keycloak.hasRealmRole('ADMIN')">

        <!-- RESTAURANGLISTA -->
        <section class="admin-panel">
          <h2>Befintliga restauranger</h2>

          <p v-if="loadingRestaurants">
            Hämtar restauranger...
          </p>

          <p
              v-if="restaurantsError"
              class="error-message"
              role="alert"
          >
            {{ restaurantsError }}
          </p>

          <p
              v-if="
              !loadingRestaurants &&
              !restaurantsError &&
              restaurants.length === 0
            "
          >
            Det finns inga registrerade restauranger.
          </p>

          <div
              v-if="restaurants.length > 0"
              class="table-container"
          >
            <table>
              <thead>
              <tr>
                <th>ID</th>
                <th>Namn</th>
                <th>Kök</th>
                <th>Stad</th>
                <th>Sittplatser</th>
              </tr>
              </thead>

              <tbody>
              <tr
                  v-for="restaurant in restaurants"
                  :key="restaurant.id"
              >
                <td>{{ restaurant.id }}</td>
                <td>{{ restaurant.name }}</td>
                <td>{{ restaurant.cuisine }}</td>
                <td>{{ restaurant.city }}</td>
                <td>{{ restaurant.seats }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SKAPA RESTAURANG -->
        <section class="admin-panel">
          <h2>Skapa ny restaurang</h2>

          <form @submit.prevent="createRestaurant">

            <div class="form-group">
              <label for="name">
                Restaurangens namn
              </label>

              <input
                  id="name"
                  v-model="name"
                  type="text"
                  required
              />
            </div>

            <div class="form-group">
              <label for="cuisine">
                Typ av kök
              </label>

              <input
                  id="cuisine"
                  v-model="cuisine"
                  type="text"
                  required
              />
            </div>

            <div class="form-group">
              <label for="city">
                Stad
              </label>

              <input
                  id="city"
                  v-model="city"
                  type="text"
                  required
              />
            </div>

            <div class="form-group">
              <label for="seats">
                Antal sittplatser
              </label>

              <input
                  id="seats"
                  v-model.number="seats"
                  type="number"
                  min="1"
                  required
              />
            </div>

            <button
                type="submit"
                class="submit-button"
                :disabled="isCreating"
            >
              {{
                isCreating
                    ? 'Skapar restaurang...'
                    : 'Skapa restaurang'
              }}
            </button>
          </form>

          <p
              v-if="restaurantError"
              class="error-message"
              role="alert"
          >
            {{ restaurantError }}
          </p>

          <div
              v-if="createdRestaurant"
              class="success-message"
              role="status"
          >
            <h3>Restaurangen har skapats!</h3>

            <p>
              Namn: {{ createdRestaurant.name }}
            </p>

            <p>
              Kök: {{ createdRestaurant.cuisine }}
            </p>

            <p>
              Stad: {{ createdRestaurant.city }}
            </p>

            <p>
              Antal sittplatser:
              {{ createdRestaurant.seats }}
            </p>
          </div>
        </section>
      </div>

      <p
          v-else
          class="error-message"
          role="alert"
      >
        Du saknar behörighet att administrera restauranger.
      </p>

    </div>
  </main>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  padding: 70px 24px 100px;
  background: #f8f6f1;
  color: #252c27;
}

.admin-container {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-heading {
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

.admin-heading h1 {
  margin-bottom: 15px;
  color: #263f35;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 400;
}

.admin-heading > p:last-child {
  color: #56645b;
}

.admin-panel {
  margin-bottom: 32px;
  padding: 35px;
  border: 1px solid #e9e1d3;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 35px rgba(38, 63, 53, 0.05);
}

.admin-panel h2 {
  margin-bottom: 25px;
  color: #263f35;
  font-family: Georgia, serif;
  font-size: 1.8rem;
  font-weight: 400;
}

/* Restauranglista */

.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 15px 18px;
  border-bottom: 1px solid #e9e1d3;
  text-align: left;
}

th {
  background: #263f35;
  color: #ffffff;
  font-weight: 600;
}

tbody tr:nth-child(even) {
  background: #f8f6f1;
}

/* Formulär */

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

.form-group input {
  width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border: 1px solid #d6d9d1;
  border-radius: 6px;
  background: #ffffff;
  color: #252c27;
  font: inherit;
}

.form-group input:focus {
  outline: 2px solid #607766;
  outline-offset: 2px;
}

.submit-button {
  min-height: 50px;
  padding: 12px 28px;
  border: none;
  border-radius: 6px;
  background: #263f35;
  color: #ffffff;
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

/* Meddelanden */

.error-message {
  margin-top: 20px;
  padding: 16px;
  border-radius: 6px;
  background: #fff0ed;
  color: #9c3025;
}

.success-message {
  margin-top: 25px;
  padding: 22px;
  border: 1px solid #a8b6a1;
  border-radius: 8px;
  background: #f1f5ee;
}

.success-message h3 {
  margin-bottom: 15px;
  color: #263f35;
  font-family: Georgia, serif;
}

.success-message p {
  margin: 8px 0;
}

/* Mobilanpassning */

@media (max-width: 600px) {
  .admin-page {
    padding: 45px 16px 70px;
  }

  .admin-panel {
    padding: 22px 18px;
  }

  th,
  td {
    padding: 12px;
    font-size: 0.85rem;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
