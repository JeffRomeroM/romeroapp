import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import { supabase } from '../supabase'
import Carrito from '../views/Carrito.vue'
import Entradas from '../views/Entradas.vue'
import Inventario from '../views/Inventario.vue'
import PerfilTienda from '../views/PerfilTienda.vue'
import Salidas from '../views/Salidas.vue'
import VistaPublica from '../views/VistaPublica.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/carrito',
    component: Carrito,
    meta: { requiresAuth: true }
  },
  {
    path: '/entradas',
    component: Entradas,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventario',
    component: Inventario,
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil_tienda',
    component: PerfilTienda,
    meta: { requiresAuth: true }
  },
  {
    path: '/salidas',
    component: Salidas,
    meta: { requiresAuth: true }
  },
  {
    path: '/:nombre_tienda',
    component: VistaPublica
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
