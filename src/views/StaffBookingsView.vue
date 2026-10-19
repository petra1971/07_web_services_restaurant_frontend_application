<script setup>
import { ref, onMounted } from 'vue'
import keycloak from '../auth/keycloak'

const bookings = ref([])
const staffError = ref('')

async function loadBookings() {
  if (!keycloak.hasRealmRole('STAFF')) {
    return
  }

  try {
    await keycloak.updateToken(30)

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log('Bokningar från API:', data)

    bookings.value = data._embedded?.['bookings:bookingResourceList'] ?? []

    console.log('HATEOAS-länkar:', bookings.value[0]?._links)

  } catch (error) {
    console.error('Kunde inte hämta bokningar:', error)
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

async function confirmBooking(booking) {
  staffError.value = ''

  const confirmLink = booking._links?.['bookings:confirm']

  if (!confirmLink) {
    staffError.value = 'Bokningen kan inte bekräftas i sin nuvarande status.'
    return
  }

  try {
    await keycloak.updateToken(30)

    const response = await fetch(confirmLink.href, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    console.log('Bokningen har bekräftats:', booking.id)

    await loadBookings()

  } catch (error) {
    console.error('Kunde inte bekräfta bokningen:', error)

    staffError.value = getBookingErrorMessage(error)
  }
}

async function cancelBooking(booking) {
  staffError.value = ''

  const cancelLink = booking._links?.['bookings:cancel']

  if (!cancelLink) {
    staffError.value = 'Bokningen kan inte avbokas i sin nuvarande status.'
    return
  }

  try {
    await keycloak.updateToken(30)

    const response = await fetch(cancelLink.href, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    await loadBookings()

  } catch (error) {
    console.error('Kunde inte avboka:', error)

    staffError.value = getBookingErrorMessage(error)
  }
}

async function seatBooking(booking) {
  staffError.value = ''

  const seatLink = booking._links?.['bookings:seat']

  if (!seatLink) {
    staffError.value = 'Gästerna kan inte placeras vid bord i bokningens nuvarande status.'
    return
  }

  try {
    await keycloak.updateToken(30)

    const response = await fetch(seatLink.href, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    await loadBookings()

  } catch (error) {
    console.error('Kunde inte registrera gästerna:', error)

    staffError.value = getBookingErrorMessage(error)
  }
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

function formatArrivalTime(arrivalTime) {
  if (!arrivalTime) return ''

  const date = new Date(arrivalTime)

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
  <main>
    <h1>Hantera bokningar</h1>
    <p>Inloggad som: {{ keycloak.tokenParsed?.preferred_username }}</p>
    <p v-if="keycloak.hasRealmRole('STAFF')">
      Du har behörighet att hantera bokningar.
    </p>
    <p v-else>
      Du saknar behörighet att hantera bokningar.
    </p>

    <h2>Inkomna bokningar</h2>

    <p v-if="staffError" role="alert">
      {{ staffError }}
    </p>

    <p v-if="bookings.length === 0">
      Inga bokningar att visa.
    </p>
    <table v-else>
      <thead>
      <tr>
        <th>ID</th>
        <th>Gäst</th>
        <th>Ankomst</th>
        <th>Antal gäster</th>
        <th>Status</th>
        <th>Åtgärder</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="booking in bookings" :key="booking.id">
        <td>{{ booking.id }}</td>
        <td>{{ booking.guestName }}</td>
        <td>{{ formatArrivalTime(booking.arrivalTime) }}</td>
        <td>{{ booking.partySize }}</td>
        <td>{{ formatStatus(booking.status) }}</td>
        <td>
          <button
              v-if="booking._links?.['bookings:confirm']"
              type="button"
              @click="confirmBooking(booking)"
          >
            Bekräfta
          </button>
          <button
            v-if="booking._links?.['bookings:cancel']"
            type="button"
            @click="cancelBooking(booking)"
        >
          Avboka
        </button>
        <button
            v-if="booking._links?.['bookings:seat']"
            type="button"
            @click="seatBooking(booking)"
        >
          Sätt vid bord
        </button>
        </td>
      </tr>
      </tbody>
    </table>

  </main>
</template>