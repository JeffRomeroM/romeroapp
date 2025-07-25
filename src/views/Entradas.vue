<template>
  <Header />
  <div class="container">
    <h2>Registrar Venta</h2>

    <!-- Formulario cliente -->
    <div class="cliente-form">
      <input v-model="cliente" type="text" placeholder="Nombre del cliente" />
      <input v-model="clienteCelular" type="tel" placeholder="Número de celular" />
    </div>
    <input
      v-model="filtroBusqueda"
      type="text"
      placeholder="Buscar producto..."
      class="buscador"
    />

    <!-- Productos para seleccionar -->
    <div class="productos-grid">
      <div  v-for="p in productosFiltrados" :key="p.id" class="card-producto">
        <img v-if="p.imagen_url" :src="p.imagen_url" alt="foto" />
        <h3>{{ p.nombre }}</h3>
        <p>Stock: {{ p.stock }}</p>
        <p>Precio: C$ {{ p.precio }}</p>
        <input
          type="number"
          min="0"
          :max="p.stock"
          v-model.number="cantidades[p.id]"
          placeholder="Cantidad"
        />
      </div>
    </div>

    <button @click="registrarVenta" :disabled="!puedeVender">Registrar Venta</button>

    <!-- Mostrar todas las facturas -->
    <div v-if="facturas.length" class="facturas-container">
      <h2>Facturas Generadas</h2>
      <div v-for="(factura, index) in facturas" :key="index" class="factura">
        <h3>Factura #{{ factura.id }}</h3>
        <p><strong>Cliente:</strong> {{ factura.cliente }}</p>
        <p><strong>Celular:</strong> {{ factura.clienteCelular }}</p>
        <p><strong>Fecha:</strong> {{ factura.fecha }}</p>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in factura.items" :key="item.producto_id">
              <td>{{ item.nombre }}</td>
              <td>{{ item.cantidad }}</td>
              <td>C$ {{ item.precio }}</td>
              <td>C$ {{ (item.precio * item.cantidad).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
        <h4>Total: C$ {{ factura.total.toFixed(2) }}</h4>
        <button @click="imprimirFactura(factura.id)">Imprimir</button>
        <button @click="enviarWhatsApp(factura)">Enviar por WhatsApp</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import Header from '../components/Header.vue'

const productos = ref([])
const cantidades = reactive({})
const cliente = ref('')
const clienteCelular = ref('')
const facturas = ref([])

const cargarProductos = async () => {
  const user = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase.from('productos').select('*').eq('user_id', user.id)
  if (!error) productos.value = data || []
}

const filtroBusqueda = ref('')
const productosFiltrados = computed(() => {
  if (!filtroBusqueda.value.trim()) return productos.value
  return productos.value.filter(p =>
    p.nombre.toLowerCase().includes(filtroBusqueda.value.toLowerCase())
  )
})


const puedeVender = computed(() => {
  if (!cliente.value.trim() || !clienteCelular.value.trim()) return false
  return Object.values(cantidades).some(c => c > 0)
})

async function registrarVenta() {
  if (!puedeVender.value) {
    alert('Complete los datos y seleccione al menos un producto con cantidad mayor a 0.')
    return
  }
  const user = (await supabase.auth.getUser()).data.user

  const ventasAInsertar = []
  const items = []

  for (const p of productos.value) {
    const cant = cantidades[p.id] || 0
    if (cant > 0) {
      if (cant > p.stock) {
        alert(`Cantidad de ${p.nombre} excede el stock disponible.`)
        return
      }
      ventasAInsertar.push({
        user_id: user.id,
        producto_id: p.id,
        cantidad: cant,
        fecha: new Date().toISOString().split('T')[0],
        cliente: cliente.value,
        clienteCelular: clienteCelular.value
      })
      items.push({ producto_id: p.id, nombre: p.nombre, cantidad: cant, precio: p.precio })
    }
  }

  try {
  const { error } = await supabase.from("entradas").insert(ventasAInsertar);


  if (error) throw error;
  // Registro exitoso
} catch (error) {
  console.error("Error al registrar venta:", error.message || error);
}


  for (const item of items) {
    const prod = productos.value.find(p => p.id === item.producto_id)
    const nuevoStock = prod.stock - item.cantidad
    await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
  }

  await cargarProductos()
  await cargarFacturas()

  // Limpiar
  for (const key in cantidades) cantidades[key] = 0
  cliente.value = ''
  clienteCelular.value = ''
}

async function cargarFacturas() {
  const user = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase
    .from('entradas')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('Error al cargar facturas:', error)
    return
  }

  const facturasMap = new Map()

  for (const venta of data) {
    const key = `${venta.cliente}|${venta.clienteCelular}|${venta.fecha}`
    if (!facturasMap.has(key)) {
      facturasMap.set(key, {
        id: venta.id,
        cliente: venta.cliente,
        clienteCelular: venta.clienteCelular,
        fecha: venta.fecha,
        items: [],
        total: 0
      })
    }
    const factura = facturasMap.get(key)
    factura.items.push({
      producto_id: venta.producto_id,
      nombre: '',
      cantidad: venta.cantidad,
      precio: 0
    })
  }

  for (const factura of facturasMap.values()) {
    for (const item of factura.items) {
      const prod = productos.value.find(p => p.id === item.producto_id)
      if (prod) {
        item.nombre = prod.nombre
        item.precio = prod.precio
        factura.total += prod.precio * item.cantidad
      }
    }
  }

  facturas.value = Array.from(facturasMap.values())
}

function imprimirFactura(id) {
  const factura = facturas.value.find(f => f.id === id)
  if (!factura) return

  const ventanaImpresion = window.open('', '', 'width=800,height=600')
  ventanaImpresion.document.write('<html><head><title>Factura</title></head><body>')
  ventanaImpresion.document.write(`<h2>Factura de Venta</h2>`)
  ventanaImpresion.document.write(`<p><strong>Cliente:</strong> ${factura.cliente}</p>`)
  ventanaImpresion.document.write(`<p><strong>Celular:</strong> ${factura.clienteCelular}</p>`)
  ventanaImpresion.document.write(`<p><strong>Fecha:</strong> ${factura.fecha}</p>`)

  ventanaImpresion.document.write('<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">')
  ventanaImpresion.document.write('<thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead><tbody>')
  factura.items.forEach(item => {
    ventanaImpresion.document.write(`<tr>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>C$ ${item.precio.toFixed(2)}</td>
      <td>C$ ${(item.precio * item.cantidad).toFixed(2)}</td>
    </tr>`)
  })
  ventanaImpresion.document.write('</tbody></table>')
  ventanaImpresion.document.write(`<h3>Total: C$ ${factura.total.toFixed(2)}</h3>`)
  ventanaImpresion.document.write('</body></html>')

  ventanaImpresion.document.close()
  ventanaImpresion.focus()
  ventanaImpresion.print()
  ventanaImpresion.close()
}

// Función para enviar factura por WhatsApp
function enviarWhatsApp(factura) {
  let mensaje = `*Factura de Venta*\nCliente: ${factura.cliente}\nCelular: ${factura.clienteCelular}\nFecha: ${factura.fecha}\n\n`
  mensaje += `Producto | Cantidad | Precio Unitario | Subtotal\n`
  factura.items.forEach(item => {
    mensaje += `${item.nombre} | ${item.cantidad} | C$${item.precio.toFixed(2)} | C$${(item.precio * item.cantidad).toFixed(2)}\n`
  })
  mensaje += `\n*Total: C$${factura.total.toFixed(2)}*`

  // Remplazar caracteres especiales y espacios
  const textoUrl = encodeURIComponent(mensaje)
  // Número cliente sin espacios ni símbolos, solo números
  const celular = factura.clienteCelular.replace(/\D/g, '')

  const urlWhatsApp = `https://wa.me/${celular}?text=${textoUrl}`

  window.open(urlWhatsApp, '_blank')
}

onMounted(async () => {
  await cargarProductos()
  await cargarFacturas()
})
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}
.cliente-form {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}
.cliente-form input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}
.card-producto {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 0 5px rgba(0,0,0,0.05);
}
.card-producto img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 10px;
}
.card-producto input[type='number'] {
  width: 90%;
  padding: 6px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  margin-left: 5px;
}
button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
.facturas-container {
  margin-top: 40px;
}
.factura {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 25px;
}
.factura table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  margin-bottom: 10px;
}
.factura th, .factura td {
  border: 1px solid #ccc;
  padding: 0px;
  text-align: center;
}
.factura th {
  background-color: #f0f0f0;
}
.buscador {
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-bottom: 20px;
  width: 98%;
}

@media (max-width: 600px) {
  .cliente-form {
    flex-direction: column;
  }

  .productos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .factura table {
    font-size: 12px;
  }

  .factura h3, .factura h4 {
    font-size: 16px;
  }


  .buscador {
    margin-bottom: 15px;
    padding: 10px;
    font-size: 16px;
    width: 95%;
    
  }
  input{
    width: 95%;
  }
}

</style>
