<template>
  <div class="container">
    <h2>Registrar Salida</h2>
    <form @submit.prevent="guardarSalida">
      <select v-model="salida.producto_id" required>
        <option value="" disabled>Selecciona un producto</option>
        <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
      <input type="number" v-model.number="salida.cantidad" placeholder="Cantidad" required />
      <input type="text" v-model="salida.cliente" placeholder="Nombre del cliente" required />
      <input type="date" v-model="salida.fecha" required />
      <button type="submit">Registrar</button>
    </form>

    <div v-if="salidas.length" class="lista-productos">
      <div v-for="s in salidas" :key="s.id" class="producto">
        <div>
          <h3>{{ buscarNombre(s.producto_id) }}</h3>
          <p>Cantidad: {{ s.cantidad }}</p>
          <p>Cliente: {{ s.cliente }}</p>
          <p>Fecha: {{ s.fecha }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const salida = ref({ producto_id: '', cantidad: 0, cliente: '', fecha: new Date().toISOString().substring(0, 10) })
const salidas = ref([])
const productos = ref([])

const cargarProductos = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { data } = await supabase.from('productos').select('*').eq('user_id', user.id)
  productos.value = data || []
}

const cargarSalidas = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { data } = await supabase.from('salidas').select('*').eq('user_id', user.id).order('fecha', { ascending: false })
  salidas.value = data || []
}

const guardarSalida = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { error } = await supabase.from('salidas').insert({
    ...salida.value,
    user_id: user.id
  })
  if (!error) {
    salida.value = { producto_id: '', cantidad: 0, cliente: '', fecha: new Date().toISOString().substring(0, 10) }
    cargarSalidas()
  }
}

const buscarNombre = (id) => {
  const prod = productos.value.find(p => p.id === id)
  return prod ? prod.nombre : 'Producto desconocido'
}

onMounted(() => {
  cargarProductos()
  cargarSalidas()
})
</script>

<style src="../assets/estilos.css"></style>


