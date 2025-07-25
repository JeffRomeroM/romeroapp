<template>
  <Header />
  <div class="dashboard-container">
    <h2 class="title">Dashboard</h2>

    <div class="cards">
      <div class="card blue">
        <h3>Total Productos</h3>
        <p>{{ totalProductos }}</p>
      </div>
      <div class="card green">
        <h3>Entradas</h3>
        <p>{{ totalEntradas }}</p>
      </div>
      <div class="card red">
        <h3>Salidas</h3>
        <p>{{ totalSalidas }}</p>
      </div>
      <div class="card purple">
        <h3>Balance</h3>
        <p>{{ balance }}</p>
      </div>
    </div>

    <h3 class="chart-title">Comparativa</h3>
    <div class="bar-chart">
      <div class="bar">
        <div class="bar-label">Entradas</div>
        <div class="bar-fill green" :style="{ width: entradasWidth + '%' }"></div>
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
  totalEntradas.value = entradas?.reduce((sum, e) => sum + e.cantidad, 0) || 0
  totalSalidas.value = salidas?.reduce((sum, s) => sum + s.cantidad, 0) || 0
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
  max-width: 960px;
  margin: auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: #222;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.1);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1rem;
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.15);
}

.card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.6rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card p {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
}

.card.blue {
  background: linear-gradient(135deg, #2196f3, #21cbf3);
}
.card.green {
  background: linear-gradient(135deg, #4caf50, #81c784);
}
.card.red {
  background: linear-gradient(135deg, #f44336, #e57373);
}
.card.purple {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
}

.chart-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.bar-chart {
  max-width: 500px;
  margin: 0 auto 3rem auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.bar {
  background: #e0e0e0;
  border-radius: 1.5rem;
  overflow: hidden;
  position: relative;
  height: 35px;
  box-shadow: inset 0 1px 3px rgba(255,255,255,0.7);
}

.bar-label {
  position: absolute;
  top: 0;
  left: 16px;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 2;
  text-shadow: 0 0 6px rgba(0,0,0,0.6);
  user-select: none;
}

.bar-fill {
  height: 100%;
  border-radius: 1.5rem;
  transition: width 0.7s ease;
  opacity: 0.95;
}

.bar-fill.green {
  background: linear-gradient(90deg, #4caf50, #81c784);
  box-shadow: 0 0 10px #4caf50aa;
}

.bar-fill.red {
  background: linear-gradient(90deg, #f44336, #e57373);
  box-shadow: 0 0 10px #f44336aa;
}

/* Responsive */
@media (max-width: 700px) {
  .dashboard-container {
    padding: 1rem 0.5rem;
  }
  .title {
    font-size: 1.8rem;
  }
  .cards {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .card p {
    font-size: 1.8rem;
  }
  .bar-chart {
    max-width: 100%;
  }
  .bar-label {
    font-size: 0.9rem;
    left: 10px;
  }
  .bar {
    height: 28px;
  }
}
@media (max-width: 400px) {
  .cards {
    grid-template-columns: 1fr;
  }
  .card p {
    font-size: 1.4rem;
  }
  .bar-label {
    font-size: 0.8rem;
  }
}
</style>
