<template>
  <Header />
  <div v-if="userId" class="egresos">
    <div class="top-bar">
      <input v-model="filtro" placeholder="Buscar concepto..." />
      <button @click="mostrarModal = true">+ Nuevo Egreso</button>
    </div>

    <h3>Egresos Registrados</h3>
    <ul>
      <li v-for="e in egresosFiltrados" :key="e.id">
        {{ e.fecha }} - {{ e.concepto }}: C$ {{ e.monto }}
        <button @click="editar(e)">✏️</button>
        <button @click="confirmarEliminar(e.id)">🗑️</button>
      </li>
    </ul>

    <!-- Modal Formulario -->
    <div v-if="mostrarModal" class="modal">
      <div class="modal-content">
        <h2>{{ editando ? 'Editar Egreso' : 'Nuevo Egreso' }}</h2>
        <form @submit.prevent="guardarEgreso">
          <input v-model="form.concepto" placeholder="Concepto" required />
          <input v-model.number="form.monto" type="number" placeholder="Monto" required />
          <input v-model="form.fecha" type="date" required />
          <div class="modal-buttons">
            <button type="submit">{{ editando ? 'Actualizar' : 'Guardar' }}</button>
            <button @click.prevent="cerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmación -->
    <div v-if="mostrarConfirmacion" class="modal">
      <div class="modal-content">
        <p>¿Eliminar este egreso?</p>
        <div class="modal-buttons">
          <button @click="eliminar(confirmarId)">Sí</button>
          <button @click="mostrarConfirmacion = false">No</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <p>Debes iniciar sesión para ver esta página.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import Header from '../components/Header.vue'

const form = ref({ concepto: '', monto: null, fecha: '' })
const egresos = ref([])
const userId = ref(null)
const editando = ref(false)
const editId = ref(null)
const mostrarModal = ref(false)
const mostrarConfirmacion = ref(false)
const confirmarId = ref(null)
const filtro = ref('')

const egresosFiltrados = computed(() =>
  egresos.value.filter(e =>
    e.concepto.toLowerCase().includes(filtro.value.toLowerCase())
  )
)

const cargarEgresos = async () => {
  const { data, error } = await supabase
    .from('salidas')
    .select('*')
    .eq('user_id', userId.value)
    .order('fecha', { ascending: false })

  if (!error) egresos.value = data
}

const guardarEgreso = async () => {
  if (!form.value.concepto || !form.value.monto || !form.value.fecha) return

  if (editando.value) {
    await supabase
      .from('salidas')
      .update({ ...form.value })
      .eq('id', editId.value)
  } else {
    await supabase.from('salidas').insert({
      user_id: userId.value,
      ...form.value
    })
  }

  cerrarModal()
  cargarEgresos()
}

const editar = (egreso) => {
  form.value = { concepto: egreso.concepto, monto: egreso.monto, fecha: egreso.fecha }
  editId.value = egreso.id
  editando.value = true
  mostrarModal.value = true
}

const cerrarModal = () => {
  form.value = { concepto: '', monto: null, fecha: '' }
  editando.value = false
  editId.value = null
  mostrarModal.value = false
}

const confirmarEliminar = (id) => {
  confirmarId.value = id
  mostrarConfirmacion.value = true
}

const eliminar = async (id) => {
  await supabase.from('salidas').delete().eq('id', id)
  mostrarConfirmacion.value = false
  cargarEgresos()
}

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  userId.value = data?.user?.id || null
  if (userId.value) cargarEgresos()
})
</script>

<style scoped>
.egresos {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
}
.top-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
@media (min-width: 500px) {
  .top-bar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}
button {
  padding: 0.4rem 0.8rem;
  margin-right: 0.4rem;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 0.5rem;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

/* Modal base */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
