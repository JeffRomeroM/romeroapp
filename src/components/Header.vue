<template>
  <div class="app-container" @click.self="cerrarMenu">
    <header class="header">
      <button class="menu-btn" @click.stop="menuAbierto = !menuAbierto">☰</button>
    

      <div class="usuario" @click.stop="mostrarMenu = !mostrarMenu">
        <div class="info">
          <p class="tienda"> Tienda {{ tienda }} </p>
          <p class="nombre">{{ nombre }} </p>
        </div>
        <div v-if="mostrarMenu" class="menu-user">
          <p >📱 {{ telefono }}</p>
          <p @click="logout">Cerrar sesión</p>
        </div>
      </div>
    </header>

    <transition name="slide">
      <aside v-if="menuAbierto" class="sidebar" @click.stop>
        <router-link to="/dashboard" @click.native="cerrarMenu">Inicio</router-link>
        <router-link to="/inventario" @click.native="cerrarMenu">Inventario</router-link>
        <router-link to="/entradas" @click.native="cerrarMenu">Entradas</router-link>
        <router-link to="/salidas" @click.native="cerrarMenu">Salidas</router-link>
        <router-link to="/carrito" @click.native="cerrarMenu">Carrito</router-link>
        <router-link :to="'/' + tienda" @click.native="cerrarMenu">Tienda pública</router-link>
        <button @click="compartirTienda">Compartir tienda</button>

      </aside>
    </transition>

    <div v-if="menuAbierto" class="overlay" @click="cerrarMenu"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const nombre = ref('')
const tienda = ref('')
const telefono = ref('')
const menuAbierto = ref(false)
const mostrarMenu = ref(false)

onMounted(async () => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (user) {
    const { data: profile } = await supabase
      .from('usuarios')
      .select('nombre, nombre_tienda, telefono')
      .eq('id', user.id)
      .single()

    nombre.value = profile?.nombre || user.email
    telefono.value = profile?.telefono || 'Sin teléfono'
    tienda.value = profile?.nombre_tienda || 'Mi Tienda'
  }
})


const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

const cerrarMenu = () => {
  menuAbierto.value = false
  mostrarMenu.value = false
}

const compartirTienda = () => {
  if (!tienda.value) {
    console.error('Nombre de tienda no disponible')
    return
  }

  const url = `${window.location.origin}/${tienda.value}`
  const mensaje = `¡Mirá mi tienda en línea! 🛒`

  if (navigator.share) {
    navigator.share({
      title: 'Mi tienda',
      text: mensaje,
      url // solo aquí va el link
    }).catch((err) => console.error('Error al compartir:', err))
  } else {
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensaje + '\n' + url)}`
    window.open(whatsapp, '_blank')
  }
}



</script>

<style scoped>


.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 30;
}

.menu-btn {
  background: none;
  border: none;
  color: black;
  font-size: 1.8rem;
  cursor: pointer;
}

.titulo {
  font-size: 1.4rem;
  font-weight: bold;
}

.usuario {
  position: relative;
  cursor: pointer;
}

.nombre {
  font-weight: 600;
  margin: 0;
  background-color: #eeecec;
  border-radius: 5px;
}

.menu-user {
  position: absolute;
  right: 0;
  top: 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 80px;
  z-index: 50;
}
.info{
  display: flex;
}
.info p {
  margin: 0;
  padding: 0.2rem 0.5rem;
  font-size: 14px;
  font-weight: bold;
}
.info .tienda {
  font-size: 12px;
  color: #042b72;
}
.menu-user p {
  margin: 0.3rem 0;
  padding:2px 5px;
  border-radius: 5px;
  font-size: 12px;
  transition: background 0.2s;
}

.menu-user p:hover {
  background: #f0f0f0;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 220px;
  background: #ffffff;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 50px;
  z-index: 35;
}

.sidebar a {
  text-decoration: none;
  color: #222;
  font-weight: 600;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 25;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}
</style>
