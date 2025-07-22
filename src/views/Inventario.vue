<template>
  <Header />
  <div class="app">
    <h1>Inventario</h1>

    <div class="filtros">
      <input v-model="filtroNombre" placeholder="Buscar producto" class="buscar" />
      <select v-model="filtroCategoria">
        <option value="">Todas las categorías</option>
        <option v-for="cat in categoriasDisponibles" :key="cat">{{ cat }}</option>
      </select>
      <button @click="limpiarFiltros" class="limpiar">Limpiar</button>
      <button class="btn-nueva" @click="abrirModal">+</button>
    </div>

    <div class="cards">
      <div v-for="producto in productosPaginados" :key="producto.id" class="card">
        <img v-if="producto.imagen_url" :src="producto.imagen_url" class="preview-foto" />
        <h3>{{ producto.nombre }}</h3>
        <p>{{ producto.descripcion }}</p>
        <p><strong>Precio:</strong> C$ {{ producto.precio }}</p>
        <p><strong>Stock:</strong> {{ producto.stock }}</p>
        <p><strong>Categoría:</strong> {{ producto.categoria }}</p>
        <div class="acciones">
          <button @click="editar(producto)">Editar</button>
          <button class="eliminar" @click="confirmarEliminar(producto.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <div class="paginacion">
      <button @click="paginaActual--" :disabled="paginaActual === 1">Anterior</button>
      <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas">Siguiente</button>
    </div>

    <!-- Modal Agregar/Editar -->
    <div class="modal" v-if="mostrarModal">
      <div class="modal-content">
        <h2>{{ editando ? 'Editar' : 'Nuevo' }} Producto</h2>
        <form @submit.prevent="guardarProducto" class="formulario">
          <input v-model="producto.nombre" placeholder="Nombre" required />
          <input v-model="producto.descripcion" placeholder="Descripción" />
          <input v-model.number="producto.precio" type="number" placeholder="Precio" required />
          <input v-model.number="producto.stock" type="number" placeholder="Stock" required />
          <select v-model="producto.categoria">
            <option disabled value="">Seleccione categoría</option>
            <option v-for="cat in categoriasDisponibles" :key="cat">{{ cat }}</option>
          </select>
          <input type="file" @change="subirFoto" />
          <div class="acciones-form">
            <button type="submit">Guardar</button>
            <button type="button" @click="cerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmación Eliminar -->
    <div class="modal" v-if="mostrarModalEliminar">
      <div class="modal-content">
        <h3>¿Eliminar este producto?</h3>
        <button @click="eliminar(idEliminar)">Sí</button>
        <button @click="cerrarModalEliminar">No</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import Header from '../components/Header.vue'

const productos = ref([])
const categoriasDisponibles = ref([])
const filtroNombre = ref('')
const filtroCategoria = ref('')
const mostrarModal = ref(false)
const mostrarModalEliminar = ref(false)
const editando = ref(false)
const subiendoFoto = ref(false)
const idEliminar = ref(null)
const paginaActual = ref(1)
const productosPorPagina = 8

const producto = reactive({
  id: null,
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  categoria: '',
  imagen_url: '',
  user_id: null
})

const productosFiltrados = computed(() => {
  return productos.value.filter(p => {
    const nombreOk = p.nombre.toLowerCase().includes(filtroNombre.value.toLowerCase())
    const categoriaOk = !filtroCategoria.value || p.categoria === filtroCategoria.value
    return nombreOk && categoriaOk
  })
})

const totalPaginas = computed(() => Math.ceil(productosFiltrados.value.length / productosPorPagina))

const productosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * productosPorPagina
  return productosFiltrados.value.slice(inicio, inicio + productosPorPagina)
})

function abrirModal() {
  Object.assign(producto, { id: null, nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen_url: '' })
  mostrarModal.value = true
  editando.value = false
}

function cerrarModal() {
  mostrarModal.value = false
}

function editar(p) {
  Object.assign(producto, p)
  mostrarModal.value = true
  editando.value = true
}

function confirmarEliminar(id) {
  idEliminar.value = id
  mostrarModalEliminar.value = true
}

function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
  idEliminar.value = null
}

async function subirFoto(e) {
  const file = e.target.files[0]
  if (!file) return
  subiendoFoto.value = true
  const fileName = `productos/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage.from('fotos').upload(fileName, file)
  if (!uploadError) {
    const { data } = supabase.storage.from('fotos').getPublicUrl(fileName)
    producto.imagen_url = data.publicUrl
  }
  subiendoFoto.value = false
}

async function guardarProducto() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    alert('No se pudo obtener el usuario autenticado.');
    return;
  }

  const datos = { ...producto };
  if (!editando.value) datos.user_id = user.id;
  delete datos.id;

  let res;
  if (editando.value && producto.id) {
    res = await supabase.from('productos').update(datos).eq('id', producto.id);
  } else {
    res = await supabase.from('productos').insert([datos]);
  }

  if (!res.error) {
    cerrarModal();
    await cargarProductos();
  } else {
    console.error(res.error);
    alert('Error al guardar producto');
  }
}

async function eliminar(id) {
  // 1. Obtener la URL de la imagen asociada al producto
  const { data, error } = await supabase.from('productos').select('imagen_url').eq('id', id).single()
  if (error) {
    console.error('Error al obtener imagen:', error)
  }

  // 2. Eliminar imagen si existe
  if (data?.imagen_url) {
    try {
      const url = new URL(data.imagen_url)
      const path = decodeURIComponent(url.pathname.replace('/storage/v1/object/public/', ''))
      await supabase.storage.from('fotos').remove([path])
    } catch (e) {
      console.error('Error eliminando la foto:', e)
    }
  }

  // 3. Eliminar producto de la base de datos
  const { error: deleteError } = await supabase.from('productos').delete().eq('id', id)
  if (deleteError) {
    console.error('Error al eliminar producto:', deleteError)
    alert('Error al eliminar el producto.')
    return
  }

  cerrarModalEliminar()
  await cargarProductos()
}


async function cargarProductos() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    alert('Error al obtener usuario.')
    return
  }

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error cargando productos:', error)
    return
  }

  productos.value = data
  categoriasDisponibles.value = [...new Set(data.map(p => p.categoria).filter(Boolean))]
}

function limpiarFiltros() {
  filtroNombre.value = ''
  filtroCategoria.value = ''
  paginaActual.value = 1
}

onMounted(cargarProductos)
</script>

<style scoped>
.app {
  max-width: 960px;
  margin: auto;
  padding: 20px;
  font-family: sans-serif;
}
.filtros {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}
.buscar, select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.btn-nueva {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0px 12px;
  border-radius: 5px;
  font-size: 24px;
  cursor: pointer;
}
.limpiar {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 0 5px rgba(0,0,0,0.05);
}
.preview-foto {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 10px;
}
.acciones button {
  margin: 3px;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: #2ecc71;
  color: white;
  cursor: pointer;
}
.acciones .eliminar {
  background: #e74c3c;
}
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; 
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 10px;
  box-sizing: border-box;
}
.modal-content {
  background: white;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  border-radius: 10px;
  text-align: center;
}
.modal-content input,
.modal-content textarea,
.modal-content select {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}
.acciones-form {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.acciones-form button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #2ecc71;
  color: white;
}
.acciones-form button:last-child {
  background: #e74c3c;
}
.paginacion {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  align-items: center;
}
.paginacion button {
  background: #2980b9;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
