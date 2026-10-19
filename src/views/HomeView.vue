<script setup>
import TheWelcome from '../components/TheWelcome.vue'
import keycloak from '../auth/keycloak'

console.log('Inloggad:', keycloak.authenticated)
console.log('Användare:', keycloak.tokenParsed?.preferred_username)
console.log('Roller:', keycloak.realmAccess?.roles)

function login() {
  keycloak.login()
}

function logout() {
  keycloak.logout({
    redirectUri: window.location.origin
  })
}

</script>

<template>
  <main>
    <TheWelcome />
    <button type="button" @click="login">
      Logga in
    </button>
    <button type="button" @click="logout">
      Logga ut
    </button>

  </main>
</template>
