<template>
  <div class="container">
    <h2>Registrar Entrada</h2>
    <form @submit.prevent="guardarEntrada">
      <select v-model="entrada.producto_id" required>
        <option value="" disabled>Selecciona un producto</option>
        <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
      <input type="number" v-model.number="entrada.cantidad" placeholder="Cantidad" required />
      <input type="date" v-model="entrada.fecha" required />
      <button type="submit">Registrar</button>
    </form>

    <div v-if="entradas.length" class="lista-productos">
      <div v-for="e in entradas" :key="e.id" class="producto">
        <div>
          <h3>{{ buscarNombre(e.producto_id) }}</h3>
          <p>Cantidad: {{ e.cantidad }}</p>
          <p>Fecha: {{ e.fecha }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const entrada = ref({ producto_id: '', cantidad: 0, fecha: new Date().toISOString().substring(0, 10) })
const entradas = ref([])
const productos = ref([])

const cargarProductos = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { data } = await supabase.from('productos').select('*').eq('user_id', user.id)
  productos.value = data || []
}

const cargarEntradas = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { data } = await supabase.from('entradas').select('*').eq('user_id', user.id).order('fecha', { ascending: false })
  entradas.value = data || []
}

const guardarEntrada = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { error } = await supabase.from('entradas').insert({
    ...entrada.value,
    user_id: user.id
  })
  if (!error) {
    entrada.value = { producto_id: '', cantidad: 0, fecha: new Date().toISOString().substring(0, 10) }
    cargarEntradas()
  }
}

const buscarNombre = (id) => {
  const prod = productos.value.find(p => p.id === id)
  return prod ? prod.nombre : 'Producto desconocido'
}

onMounted(() => {
  cargarProductos()
  cargarEntradas()
})
</script>

<style src="../assets/estilos.css"></style>
