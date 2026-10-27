<script setup>
import { ref, onMounted } from 'vue'
import keycloak from '../auth/keycloak'

const apiUrl = import.meta.env.VITE_API_URL

const bookings = ref([])
const staffError = ref('')
const loading = ref(false)
const processingBookingId = ref(null)

async function loadBookings() {
  if (!keycloak.hasRealmRole('STAFF')) {
    return
  }

  loading.value = true
  staffError.value = ''

  try {
    await keycloak.updateToken(30)

    const response = await fetch(
        `${apiUrl}/bookings?page=0&size=100`,
        {
          headers: {
            'API-Version': '1',
            'Authorization': `Bearer ${keycloak.token}`
          }
        }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log('Bokningar från API:', data)

    bookings.value =
        data._embedded?.['bookings:bookingResourceList'] ?? []

    console.log(
        'HATEOAS-länkar:',
        bookings.value[0]?._links
    )

  } catch (error) {
    console.error('Kunde inte hämta bokningar:', error)
    staffError.value =
        'Det gick inte att hämta bokningarna.'
  } finally {
    loading.value = false
  }
}

function getBookingErrorMessage(error) {
  switch (error.message) {
    case 'HTTP 400':
      return 'Åtgärden är inte tillåten för bokningens nuvarande status.'

    case 'HTTP 401':
      return 'Din inloggning är inte giltig. Logga in igen.'

    case 'HTTP 403':
      return 'Du saknar behörighet att utföra åtgärden.'

    case 'HTTP 404':
      return 'Bokningen finns inte längre.'

    case 'HTTP 409':
      return 'Bokningen har en konflikt. Uppdatera listan och försök igen.'

    default:
      return 'Åtgärden kunde inte genomföras. Försök igen.'
  }
}

async function performBookingAction(booking, relation) {
  staffError.value = ''

  const actionLink = booking._links?.[relation]

  if (!actionLink?.href) {
    staffError.value =
        'Åtgärden är inte tillgänglig för bokningens nuvarande status.'
    return
  }

  if (processingBookingId.value !== null) {
    return
  }

  processingBookingId.value = booking.id

  try {
    await keycloak.updateToken(30)

    const response = await fetch(actionLink.href, {
      method: 'POST',
      headers: {
        'API-Version': '1',
        'Authorization': `Bearer ${keycloak.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    await loadBookings()

  } catch (error) {
    console.error('Kunde inte utföra bokningsåtgärden:', error)
    staffError.value = getBookingErrorMessage(error)

  } finally {
    processingBookingId.value = null
  }
}

function confirmBooking(booking) {
  return performBookingAction(booking, 'bookings:confirm')
}

function cancelBooking(booking) {
  return performBookingAction(booking, 'bookings:cancel')
}

function seatBooking(booking) {
  return performBookingAction(booking, 'bookings:seat')
}

function formatStatus(status) {
  const statuses = {
    REQUESTED: 'Väntar på bekräftelse',
    CONFIRMED: 'Bekräftad',
    SEATED: 'Gästerna sitter vid bordet',
    CANCELLED: 'Avbokad'
  }

  return statuses[status] ?? status
}

function statusClass(status) {
  const classes = {
    REQUESTED: 'status-requested',
    CONFIRMED: 'status-confirmed',
    SEATED: 'status-seated',
    CANCELLED: 'status-cancelled'
  }

  return classes[status] ?? ''
}

function formatArrivalTime(arrivalTime) {
  if (!arrivalTime) return ''

  const date = new Date(arrivalTime)

  if (Number.isNaN(date.getTime())) {
    return arrivalTime
  }

  const formattedDate = date.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const formattedTime = date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${formattedDate} kl. ${formattedTime}`
}

onMounted(loadBookings)
</script>

<template>
  <main class="staff-page">
    <div class="staff-container">

      <header class="staff-heading">
        <p class="eyebrow">
          SKÄRGÅRDEN · PERSONAL
        </p>

        <h1>Hantera bokningar</h1>

        <p class="heading-description">
          Här kan du se inkomna bokningar,
          bekräfta reservationer, placera gäster
          vid bord och hantera avbokningar.
        </p>

        <p class="logged-in">
          Inloggad som:
          <strong>
            {{ keycloak.tokenParsed?.preferred_username }}
          </strong>
        </p>
      </header>

      <section
          v-if="keycloak.hasRealmRole('STAFF')"
          class="staff-panel"
      >
        <div class="panel-header">
          <div>
            <p class="eyebrow">BOKNINGSÖVERSIKT</p>
            <h2>Inkomna bokningar</h2>
          </div>

          <button
              type="button"
              class="refresh-button"
              :disabled="loading || processingBookingId !== null"
              @click="loadBookings"
          >
            {{ loading ? 'Uppdaterar...' : 'Uppdatera lista' }}
          </button>
        </div>

        <p
            v-if="staffError"
            class="error-message"
            role="alert"
        >
          {{ staffError }}
        </p>

        <p v-if="loading" class="info-message">
          Hämtar bokningar...
        </p>

        <p
            v-if="!loading && !staffError && bookings.length === 0"
            class="empty-message"
        >
          Det finns inga bokningar att visa.
        </p>

        <div
            v-if="bookings.length > 0"
            class="table-container"
        >
          <table>
            <thead>
            <tr>
              <th>ID</th>
              <th>Gäst</th>
              <th>Restaurang</th>
              <th>Ankomst</th>
              <th>Antal gäster</th>
              <th>Status</th>
              <th>Åtgärder</th>
            </tr>
            </thead>

            <tbody>
            <tr
                v-for="booking in bookings"
                :key="booking.id"
            >
              <td class="booking-id">
                #{{ booking.id }}
              </td>

              <td class="guest-name">
                {{ booking.guestName }}
              </td>

              <td>
                #{{ booking.restaurantId }}
              </td>

              <td>
                {{ formatArrivalTime(booking.arrivalTime) }}
              </td>

              <td>
                {{ booking.partySize }}
              </td>

              <td>
                  <span
                      class="status-badge"
                      :class="statusClass(booking.status)"
                  >
                    {{ formatStatus(booking.status) }}
                  </span>
              </td>

              <td>
                <div class="actions">

                  <button
                      v-if="booking._links?.['bookings:confirm']"
                      type="button"
                      class="action-button confirm-button"
                      :disabled="processingBookingId !== null"
                      @click="confirmBooking(booking)"
                  >
                    Bekräfta
                  </button>

                  <button
                      v-if="booking._links?.['bookings:seat']"
                      type="button"
                      class="action-button seat-button"
                      :disabled="processingBookingId !== null"
                      @click="seatBooking(booking)"
                  >
                    Sätt vid bord
                  </button>

                  <button
                      v-if="booking._links?.['bookings:cancel']"
                      type="button"
                      class="action-button cancel-button"
                      :disabled="processingBookingId !== null"
                      @click="cancelBooking(booking)"
                  >
                    Avboka
                  </button>

                  <span
                      v-if="
                        !booking._links?.['bookings:confirm'] &&
                        !booking._links?.['bookings:seat'] &&
                        !booking._links?.['bookings:cancel']
                      "
                      class="no-actions"
                  >
                      Inga åtgärder
                    </span>

                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <p class="table-note">
          Visar upp till 100 bokningar från första sidan.
        </p>
      </section>

      <section v-else class="staff-panel">
        <p class="error-message" role="alert">
          Du saknar behörighet att hantera bokningar.
        </p>
      </section>

    </div>
  </main>
</template>

<style scoped>
.staff-page {
  min-height: 100vh;
  background: #f8f6f1;
  color: #263f35;
  padding: 64px 24px 100px;
}

.staff-container {
  max-width: 1250px;
  margin: 0 auto;
}

.staff-heading {
  margin-bottom: 42px;
}

.eyebrow {
  color: #8c806e;
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 14px;
  font-weight: 600;
}

.staff-heading h1 {
  font-family: Georgia, serif;
  font-size: clamp(34px, 4vw, 50px);
  font-weight: normal;
  line-height: 1.2;
  margin: 0 0 18px;
}

.heading-description {
  max-width: 650px;
  color: #647268;
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 20px;
}

.logged-in {
  color: #647268;
  font-size: 14px;
}

.logged-in strong {
  color: #263f35;
}

.staff-panel {
  background: #ffffff;
  border-radius: 8px;
  padding: 34px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.045);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.panel-header h2 {
  font-family: Georgia, serif;
  font-weight: normal;
  font-size: 28px;
  margin: 0;
}

.refresh-button {
  background: #263f35;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.refresh-button:hover:not(:disabled) {
  background: #365747;
}

.refresh-button:disabled,
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

thead {
  background: #edf0eb;
}

th {
  padding: 17px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #263f35;
  white-space: nowrap;
}

td {
  padding: 20px 14px;
  border-bottom: 1px solid #eae8e2;
  font-size: 13px;
  color: #46574c;
  vertical-align: middle;
}

tbody tr:hover {
  background: #faf9f6;
}

.booking-id {
  font-weight: 700;
  color: #263f35;
}

.guest-name {
  font-weight: 600;
  color: #263f35;
}

.status-badge {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.status-requested {
  background: #f7edda;
  color: #966923;
}

.status-confirmed {
  background: #e1eee5;
  color: #2f6948;
}

.status-seated {
  background: #e1e9f1;
  color: #345b7d;
}

.status-cancelled {
  background: #f3e5e2;
  color: #9b4c40;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 140px;
}

.action-button {
  border: none;
  border-radius: 4px;
  padding: 10px 13px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.confirm-button,
.seat-button {
  background: #263f35;
  color: #ffffff;
}

.confirm-button:hover:not(:disabled),
.seat-button:hover:not(:disabled) {
  background: #365747;
}

.cancel-button {
  background: #f3e5e2;
  color: #9b4c40;
}

.cancel-button:hover:not(:disabled) {
  background: #ebd5d0;
}

.no-actions {
  color: #9a9a93;
  font-size: 12px;
  font-style: italic;
}

.error-message {
  color: #a13c32;
  background: #fbefec;
  border-radius: 4px;
  padding: 14px 18px;
  margin-bottom: 20px;
  font-size: 14px;
}

.info-message,
.empty-message {
  color: #647268;
  padding: 20px 0;
  font-size: 14px;
}

.table-note {
  color: #8c918a;
  font-size: 12px;
  margin-top: 20px;
}

@media (max-width: 800px) {
  .staff-page {
    padding: 36px 16px 70px;
  }

  .staff-panel {
    padding: 20px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .staff-heading h1 {
    font-size: 34px;
  }
}
</style>
