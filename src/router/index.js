import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StaffBookingsView from '../views/StaffBookingsView.vue'
import AdminRestaurantsView from '../views/AdminRestaurantsView.vue'
import keycloak from '../auth/keycloak'

const router = createRouter({  // En route kopplar en webbadress till en Vue-komponent.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/restaurants', // adressen i webläsaren
      name: 'restaurants',
      component: () => import('../views/RestaurantsView.vue'), // component talar om vilken Vue-komponent som ska visas
    },                                                                      // arrow function importerar komponenten dynamiskt. Det innebär att Vue kan vänta med att ladda komponentens JavaScript tills användaren navigerar till restaurangsidan. Det kallas lazy loading
    {
      path: '/restaurants/:id',  // Kolonet betyder att id är en dynamisk route-parameter. Det innebär att samma Vue-komponent kan användas för olika restauranger:
      name: 'restaurant-details',
      component: () => import('../views/RestaurantDetailsView.vue'),
    },
    {
      path: '/bookings',
      name: 'bookings',
      component: () => import('../views/BookingsView.vue'),
    },
    {
      path: '/staff/bookings',
      name: 'staff-bookings',
      component: StaffBookingsView,
      meta: { requiredRole: 'STAFF' }
    },
    {
      path: '/admin/restaurants',
      name: 'admin-restaurants',
      component: AdminRestaurantsView,
      meta: { requiredRole: 'ADMIN' }
    }
  ],
})

router.beforeEach((to) => {
  const requiredRole = to.meta.requiredRole

  // Sidor utan rollkrav är tillgängliga för alla
  if (!requiredRole) {
    return true
  }

  // Användaren måste vara inloggad
  if (!keycloak.authenticated) {
    keycloak.login({
      redirectUri: window.location.origin + to.fullPath
    })

    return false
  }

  // Kontrollera användarens roll
  if (!keycloak.hasRealmRole(requiredRole)) {
    return '/'
  }

  return true
})

export default router
