<template>
  <div class="container">
    <h2>Carrito de Compras</h2>
    <div v-if="carrito.length" class="lista-productos">
      <div v-for="(item, index) in carrito" :key="index" class="producto">
        <img v-if="item.imagen_url" :src="item.imagen_url" class="foto" alt="Producto" />
        <div>
          <h3>{{ item.nombre }}</h3>
          <p>Precio: ${{ item.precio }}</p>
          <input type="number" v-model.number="item.cantidad" min="1" @change="actualizarCarrito" />
          <button @click="eliminarProducto(index)" style="margin-top: 0.5rem;">Eliminar</button>
        </div>
      </div>
      <div class="total">
        <strong>Total: ${{ total }}</strong>
        <button @click="enviarWhatsApp">Enviar pedido</button>
      </div>
    </div>
    <p v-else>El carrito está vacío.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'

const carrito = ref([])
const total = computed(() => carrito.value.reduce((s, i) => s + i.precio * i.cantidad, 0))
const route = useRoute()
const tiendaId = route.params.id
let telefono = ''

onMounted(async () => {
  carrito.value = JSON.parse(localStorage.getItem('carrito') || '[]')
  const { data } = await supabase.from('usuarios').select('telefono').eq('id', tiendaId).single()
  telefono = data?.telefono || ''
})

const actualizarCarrito = () => {
  localStorage.setItem('carrito', JSON.stringify(carrito.value))
}

const eliminarProducto = (index) => {
  carrito.value.splice(index, 1)
  actualizarCarrito()
}

const enviarWhatsApp = () => {
  const mensaje = carrito.value.map(i => `🛒 ${i.nombre} x${i.cantidad} - $${i.precio * i.cantidad}`).join('\n') +
    `\n\n💰 Total: $${total.value}`
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
}
</script>

<style src="../assets/estilos.css"></style>
