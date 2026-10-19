import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
    url: 'https://keycloak-production-75ba.up.railway.app',
    realm: 'restaurant-api',
    clientId: 'restaurant-frontend'
})

export default keycloak
