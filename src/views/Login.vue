<template>
  <div class="login-container">
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="login" class="form">
      <label>
        Correo electrónico:
        <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
      </label>

      <label>
        Contraseña:
        <input v-model="password" type="password" placeholder="********" required />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="register-redirect">
      <span>¿No tienes cuenta?</span>
      <button @click="goToRegister" class="register-button">Regístrate aquí</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

const login = async () => {
  errorMessage.value = ''
  loading.value = true

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    loading.value = false
    return
  }

  if (data.user) {
    router.push('/dashboard')
  }

  loading.value = false
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 6rem 10px;
  padding: 1rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
.login-container img {
  display: block;
  margin: 0 auto 1rem;
  width: 100px; /* Ajusta el tamaño según sea necesario */
}
h2 {
  text-align: center;
  margin-bottom: 1rem;
}

.form label {
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
}

.form input {
  width: 100%;
  padding: 0.5rem 0.7rem;
  margin-top: 0.3rem;
  margin-bottom: 1rem;
  border: 1px solid #aaa;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 0.6rem 0;
  font-size: 1.1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.2s ease;
}

button:disabled {
  background-color: #73e077;
  cursor: not-allowed;
}


.error {
  margin-top: 1rem;
  color: #b91c1c;
  font-weight: 700;
  text-align: center;
}

/* Nuevo estilo para el botón de registro */
.register-redirect {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #444;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.register-button {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  text-decoration: underline;
}


</style>
