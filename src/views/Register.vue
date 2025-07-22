<template>
  <div class="register-container">
    <h1>Romero</h1>
    <h2>Registrarse</h2>
    <form @submit.prevent="registrar" class="form">
      <label>
        Nombre completo:
        <input v-model="nombre" type="text" placeholder="Ingrese nombre" required />
      </label>
      <label>
        Nombre de la tienda:
        <input v-model="nombre_tienda" type="text" placeholder="Ingrese nombre de la tienda" required />
      </label>

      <label>
        Correo electrónico:
        <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
      </label>

      <label>
        Contraseña:
        <input v-model="password" type="password" placeholder="********" required />
      </label>
      <label>
        Número WhatsApp:
        <input v-model="telefono" type="text" placeholder="87654321" required />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Registrando...' : 'Registrarse' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <p>Hemos creado tu cuenta ve a login para iniciar sesión</p>
        <button @click="goToLogin">Ir al Login</button>
      </div>
    </div>
    <div class="inicio-redirect">
      <span>¿Ya tienes cuenta?</span>
      <button @click="goToInicio" class="inicio-button">Inicia sesión aquí</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const nombre = ref('')
const nombre_tienda = ref('')
const telefono = ref('')
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)

const goToLogin = () => {
  router.push('/')
}

const registrar = async () => {
  errorMessage.value = ''
  loading.value = true

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    loading.value = false
    return
  }

  if (data.user) {
    const { error: insertError } = await supabase.from('usuarios').insert({
      id: data.user.id,
      nombre: nombre.value,
      nombre_tienda: nombre_tienda.value,
      telefono: telefono.value
    })

    if (insertError) {
      errorMessage.value = insertError.message
      loading.value = false
      return
    }
  }

  showModal.value = true
  loading.value = false
}

const goToInicio = () => {
  router.push('/')
}
</script>


<style scoped>
.register-container {
  max-width: 400px;
  margin: auto;
  margin-top: 15vh;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  background: #f9fafb; /* gris claro */
  box-shadow: 0 8px 20px rgb(37 99 235 / 0.2);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.register-container h1 {
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #10b981; /* azul */
}
.register-container h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 700;
  color: #10b981;
  font-size: 1.8rem;
}

.form label {
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.form input {
  width: 100%;
  padding: 0.65rem 1rem;
  margin-top: 0.3rem;
  margin-bottom: 1.3rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 6px #2563ebaa;
}

button {
  width: 100%;
  padding: 0.75rem 0;
  font-size: 1.15rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 10px rgb(16 185 129 / 0.5);
}

button:hover:not(:disabled) {
  background-color: #059669;
  box-shadow: 0 6px 15px rgb(5 150 105 / 0.7);
}

button:disabled {
  background-color: #6ee7b7;
  cursor: not-allowed;
  box-shadow: none;
}

.error {
  margin-top: 1rem;
  color: #b91c1c;
  font-weight: 700;
  text-align: center;
  font-size: 0.95rem;
}

.register-redirect {
  margin-top: 1rem;
  text-align: center;
}
.login-button {
  background-color: white;
  color: #1e40af;
  text-decoration: underline;
}
.login-button:hover {
  background-color: white !important;
  color: #1e40af !important;
  text-decoration: underline !important;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.modal h3 {
  margin-bottom: 1rem;
}
.modal button {
  margin-top: 1rem;
}

.inicio-button{
  background: none;
  border: none;
  color: #059669;
  font-weight: 700;
  cursor: pointer;
  width: 60%;
  margin-top: 20px;
  margin-left: 10px;
  padding: 3px ;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: 0 6px 15px rgb(5 150 105 / 0.7);
  transition: color 0.3s ease;
}

.inicio-button:hover {
  color: #f9fafb;
}
@media (max-width: 480px) {
  .register-container {
    margin: 3.5rem 1rem;
    padding: 1.5rem 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  button {
    font-size: 1rem;
  }
}

</style>
