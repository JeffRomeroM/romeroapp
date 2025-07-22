<template>
  <div class="tienda-publica">
    <header>
      <h1>Tienda {{ nombreTienda }}</h1>
      <button class="btn-carrito" @click="modalCarritoAbierto = true">
        Carrito ({{ carrito.length }})
      </button>
      <p v-if="telefono" class="telefono">📞 {{ telefono }}</p>
    </header>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="productos" v-if="productos.length">
      <div
        v-for="producto in productos"
        :key="producto.id"
        class="card"
        @click="abrirModal(producto)"
      >
        <img
          v-if="producto.imagen_url"
          :src="producto.imagen_url"
          alt="Imagen"
          class="card-img"
        />
        <div class="card-content">
          <h3>{{ producto.nombre }}</h3>
          <p>{{ producto.descripcion }}</p>
          <p class="precio">Precio: ${{ producto.precio }}</p>
          <button @click.stop="agregarAlCarrito(producto)">Añadir al carrito</button>
        </div>
      </div>
    </div>

    <div v-else>
      <p>No se encontraron productos.</p>
    </div>

    <!-- Modal imagen grande -->
    <div v-if="modalAbierto" class="modal" @click.self="cerrarModal">
      <div class="modal-content">
        <img :src="productoSeleccionado.imagen_url" alt="Imagen grande" />
        <h3>{{ productoSeleccionado.nombre }}</h3>
        <p>Descripción: {{ productoSeleccionado.descripcion }}</p>
        <p class="precio">Precio: ${{ productoSeleccionado.precio }}</p>
        <button @click="agregarAlCarrito(productoSeleccionado)">Añadir al carrito</button>
        <button class="cerrar" @click="cerrarModal">Cerrar</button>
      </div>
    </div>

    <!-- Modal Carrito -->
    <div v-if="modalCarritoAbierto" class="modal" @click.self="cerrarCarrito">
      <div class="modal-content carrito-modal">
        <h2>Carrito ({{ carrito.length }})</h2>
        <ul v-if="carrito.length">
          <li v-for="(item, index) in carrito" :key="index">
            {{ item.nombre }} - ${{ item.precio }}
            <button @click="quitarDelCarrito(index)">Quitar</button>
          </li>
        </ul>
        <p v-else>El carrito está vacío.</p>
       <p v-if="carrito.length"><strong>Total: C${{ total }}</strong></p>


        <button
          v-if="carrito.length"
          @click="enviarWhatsApp"
          class="pedido-btn"
        >
          Pedir por WhatsApp
        </button>
        <button class="cerrar" @click="cerrarCarrito">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'

const route = useRoute()
const nombreTienda = ref(route.params.nombre_tienda || '')
const productos = ref([])
const carrito = ref([])
const error = ref(null)
const telefono = ref('')
const modalAbierto = ref(false)
const modalCarritoAbierto = ref(false)
const productoSeleccionado = ref({})



const total = computed(() =>
  carrito.value.reduce((acc, item) => acc + Number(item.precio), 0)
)

const cargarProductosYTelefono = async () => {
  error.value = null
  if (!nombreTienda.value) {
    error.value = 'No se especificó la tienda'
    return
  }

  try {
    // Obtener usuario dueño de la tienda
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('id, telefono')
      .eq('nombre_tienda', nombreTienda.value)
      .single()

    if (errorUsuario || !usuario) {
      error.value = 'Tienda no encontrada'
      return
    }

    telefono.value = usuario.telefono || ''

    // Cargar productos del usuario dueño de la tienda
    const { data: productosData, error: errorProductos } = await supabase
      .from('productos')
      .select('*')
      .eq('user_id', usuario.id) // Aquí usas el user_id del dueño de la tienda

    if (errorProductos) {
      error.value = 'Error cargando productos'
      return
    }

    productos.value = productosData || []
  } catch (e) {
    error.value = 'Error inesperado: ' + e.message
  }
}



const agregarAlCarrito = (producto) => {
  carrito.value.push(producto)
}

const quitarDelCarrito = (index) => {
  carrito.value.splice(index, 1)
}

const enviarWhatsApp = () => {
  if (!carrito.value.length) return

  const items = carrito.value
    .map(
      (item, i) =>
        `${i + 1}. 📦 *${item.nombre}*\n   📝 ${item.descripcion}\n   💲 Precio: C$${item.precio}`
    )
    .join('%0A%0A')

  const total = carrito.value.reduce((acc, item) => acc + Number(item.precio), 0)

  const mensaje = `Hola,%0Aquiero hacer un pedido:%0A%0A${items}%0A%0A*Total a pagar: C$${total}*%0A%0AGracias.`

  const url = `https://wa.me/505${telefono.value.replace(/\D/g, '')}?text=${mensaje}`
  window.open(url, '_blank')
}



 

const abrirModal = (producto) => {
  productoSeleccionado.value = producto
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
}

const cerrarCarrito = () => {
  modalCarritoAbierto.value = false
}

onMounted(() => {
  cargarProductosYTelefono()
})
</script>

<style scoped>
.tienda-publica {
  max-width: 960px;
  margin: auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #222;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h1 {
  flex: 1 1 auto;
  margin: 0;
}

.telefono {
  font-size: 1rem;
  color: #2a9d8f;
  font-weight: 600;
  white-space: nowrap;
}

.btn-carrito {
  background-color: #2a9d8f;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.btn-carrito:hover {
  background-color: #21867a;
}

.productos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.2rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 0.1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 8px 15px rgb(0 0 0 / 0.15);
}

.card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}

.card-content {
  padding-left: 10px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.card-content p {
  flex-grow: 1;
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 1rem;
}

.precio {
  font-weight: bold;
  color: #2a9d8f;
  margin-bottom: 0.5rem;
}

button {
  background-color: #2a9d8f;
  border: none;
  color: white;
  padding: 0.5rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 0.9rem;
}

button:hover {
  background-color: #21867a;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.modal-content img {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.modal-content h3 {
  margin-bottom: 0.5rem;
  color: #222;
}

.modal-content p {
  color: #555;
  margin-bottom: 1rem;
}

.modal-content .precio {
  color: #2a9d8f;
  font-weight: 700;
  margin-bottom: 1rem;
}

.modal-content button {
  margin: 0 0.3rem;
}

/* Botón cerrar modal */
.cerrar {
  background: #ccc;
  color: #222;
  margin-top: 1rem;
}

.cerrar:hover {
  background: #999;
}

/* Carrito modal especifico */
.carrito-modal {
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  text-align: left;
}

.carrito-modal h2 {
  margin-bottom: 1rem;
}

.carrito-modal ul {
  list-style: none;
  padding: 0;
  margin-bottom: 1rem;
}

.carrito-modal li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #ddd;
}

.carrito-modal li button {
  background: #e63946;
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s ease;
}

.carrito-modal li button:hover {
  background: #b32a35;
}

.pedido-btn {
  width: 100%;
  background-color: #264653;
  padding: 0.7rem;
  font-weight: 700;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pedido-btn:hover {
  background-color: #1b353f;
}

/* Responsive */
@media (max-width: 600px) {
  .productos {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-img {
    height: 100px;
  }

  .modal-content {
    max-width: 80%;
    margin-left: -9%;
  }
}
</style>
