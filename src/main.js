import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import keycloak from './auth/keycloak'

keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256'
})
    .then(() => {
        createApp(App)  // Skapar Vue-applikationen med App.vue som rotkomponent.
            .use(router)
            .mount('#app')  // Startar Vue-applikationen och placerar den i HTML-elementet med id="app" i index.html.
    })
    .catch(error => {
        console.error('Keycloak initialization failed:', error)
    })
