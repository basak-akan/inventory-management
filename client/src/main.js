import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
// Shared styles load before App.vue so that App.vue's own global rules are
// the only ones that could override them, and only during the migration.
import './styles/tokens.css'
import './styles/components.css'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Inventory from './views/Inventory.vue'
import Orders from './views/Orders.vue'
import Demand from './views/Demand.vue'
import Spending from './views/Spending.vue'
import Reports from './views/Reports.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/inventory', component: Inventory },
    { path: '/orders', component: Orders },
    { path: '/demand', component: Demand },
    { path: '/spending', component: Spending },
    { path: '/reports', component: Reports }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
