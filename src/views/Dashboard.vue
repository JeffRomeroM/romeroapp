<template>
    
  <Header />
  <div class="dashboard-container">
    <h2 class="title">Dashboard</h2>

    <div class="cards">
      <div class="card">
        <h3>Total Productos</h3>
        <p>{{ totalProductos }}</p>
      </div>
      <div class="card">
        <h3>Entradas</h3>
        <p>{{ totalEntradas }}</p>
      </div>
      <div class="card">
        <h3>Salidas</h3>
        <p>{{ totalSalidas }}</p>
      </div>
      <div class="card">
        <h3>Balance</h3>
        <p>{{ balance }}</p>
      </div>
    </div>
    <h1>Dashboard</h1>

    <div class="bar-chart">
      <div class="bar">
        <div class="bar-label">Entradas</div>
        <div class="bar-fill green" :style="{ width: entradasWidth + '%' }" ></div>
      </div>
      <div class="bar">
        <div class="bar-label">Salidas</div>
        <div class="bar-fill red" :style="{ width: salidasWidth + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import Header from '../components/Header.vue'

const totalProductos = ref(0)
const totalEntradas = ref(0)
const totalSalidas = ref(0)
const balance = ref(0)

onMounted(async () => {
  const user = (await supabase.auth.getUser()).data.user
  const uid = user.id

  const { data: productos } = await supabase.from('productos').select('*').eq('user_id', uid)
  const { data: entradas } = await supabase.from('entradas').select('cantidad').eq('user_id', uid)
  const { data: salidas } = await supabase.from('salidas').select('cantidad').eq('user_id', uid)

  totalProductos.value = productos?.length || 0
  totalEntradas.value = entradas?.reduce((s, e) => s + e.cantidad, 0) || 0
  totalSalidas.value = salidas?.reduce((s, sld) => s + sld.cantidad, 0) || 0
  balance.value = totalEntradas.value - totalSalidas.value
})

const entradasWidth = computed(() => {
  const total = totalEntradas.value + totalSalidas.value
  return total ? (totalEntradas.value / total) * 100 : 0
})

const salidasWidth = computed(() => {
  const total = totalEntradas.value + totalSalidas.value
  return total ? (totalSalidas.value / total) * 100 : 0
})
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
}
.title {
  text-align: center;
  margin-bottom: 1rem;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}
.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  text-align: center;
}
.card h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.card p {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.bar {
  background: #eee;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  height: 25px;
}
.bar-label {
  position: absolute;
  top: 0;
  left: 10px;
  font-size: 0.8rem;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 2;
}
.bar-fill {
  height: 100%;
  transition: width 0.5s;
  border-radius: 1rem;
}
.green {
  background-color: #4caf50;
}
.red {
  background-color: #f44336;
}
</style>
