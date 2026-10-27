
<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import keycloak from '../auth/keycloak'

const menuOpen = ref(false)

const isLoggedIn = keycloak.authenticated === true
const isAdmin = isLoggedIn && keycloak.hasRealmRole('ADMIN')
const isStaff = isLoggedIn && keycloak.hasRealmRole('STAFF')

function closeMenu() {
  menuOpen.value = false
}

function login() {
  keycloak.login({
    redirectUri: window.location.href
  })
}

function logout() {
  keycloak.logout({
    redirectUri: window.location.origin
  })
}
</script>

<template>
  <header class="site-header">

    <RouterLink to="/" class="brand" @click="closeMenu">
      <span class="brand-name">SKÄRGÅRDEN</span>
      <span class="brand-subtitle">RESTAURANG · GÖTEBORG</span>
    </RouterLink>

    <button
        type="button"
        class="menu-toggle"
        :aria-expanded="menuOpen"
        aria-controls="main-navigation"
        aria-label="Visa eller dölj menyn"
        @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? '✕' : '☰' }}
    </button>

    <nav
        id="main-navigation"
        class="navigation"
        :class="{ 'navigation-open': menuOpen }"
    >
      <RouterLink to="/" @click="closeMenu">
        Hem
      </RouterLink>

      <RouterLink to="/#om-oss" @click="closeMenu">
        Om oss
      </RouterLink>

      <RouterLink to="/#meny" @click="closeMenu">
        Meny
      </RouterLink>

      <RouterLink to="/bookings" @click="closeMenu">
        Boka bord
      </RouterLink>

      <RouterLink
          v-if="isStaff"
          to="/staff/bookings"
          @click="closeMenu"
      >
        Personal
      </RouterLink>

      <RouterLink
          v-if="isAdmin"
          to="/admin/restaurants"
          @click="closeMenu"
      >
        Administration
      </RouterLink>

      <button
          v-if="!isLoggedIn"
          type="button"
          class="login-button"
          @click="login"
      >
        Logga in
      </button>

      <button
          v-else
          type="button"
          class="login-button"
          @click="logout"
      >
        Logga ut
      </button>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  width: 100%;
  padding: 24px clamp(24px, 7vw, 100px);
  background: #263f35;
  color: #f8f6f1;
}

.brand {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.brand-name {
  font-family: Georgia, serif;
  font-size: 1.55rem;
  letter-spacing: 0.17em;
}

.brand-subtitle {
  font-size: 0.55rem;
  letter-spacing: 0.2em;
  text-align: center;
}

.navigation {
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 28px);
}

.navigation a {
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  font-size: 0.9rem;
}

.navigation a:hover {
  color: #d9c5a8;
}

.login-button {
  padding: 11px 20px;
  border: 1px solid #e9e1d3;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.login-button:hover {
  background: #365749;
}

.menu-toggle {
  display: none;
  border: 0;
  background: transparent;
  color: white;
  font-size: 1.7rem;
  cursor: pointer;
}

@media (max-width: 850px) {
  .menu-toggle {
    display: block;
  }

  .navigation {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
    padding: 24px;
    background: #263f35;
  }

  .navigation-open {
    display: flex;
  }
}
</style>
