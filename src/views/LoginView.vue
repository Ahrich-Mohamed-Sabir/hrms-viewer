<!--
  LoginView.vue — Page de connexion
  ==================================
  Fonctionne en 2 modes :
    • Mode serveur (local)  : POST /api/login → server.js vérifie les credentials
    • Mode statique (GitHub Pages) : fallback client-side avec USERS importé directement

  Émet l'événement 'login' vers App.vue avec { name, role, groups } si succès.
-->

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">💻</div>
      <h1 class="login-title">HRMS — Code Viewer</h1>
      <p class="login-sub">Connectez-vous pour visualiser votre code</p>

      <form class="login-form" @submit.prevent="submit">

        <div class="field">
          <label>Nom</label>
          <select v-model="name" required>
            <option value="" disabled>Choisir votre nom…</option>
            <option v-for="n in names" :key="n">{{ n }}</option>
          </select>
        </div>

        <div class="field">
          <label>Mot de passe</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="login-error">⚠ {{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { USERS } from '../../files-config.js'

const emit = defineEmits(['login'])

const PASSWORD = 'sabsab12'
const names    = Object.keys(USERS)
const name     = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true

  try {
    // Mode serveur : essaie l'API
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.value, password: password.value }),
    })
    const data = await res.json()
    if (!res.ok) { error.value = data.error; return }
    emit('login', data)

  } catch {
    // Mode statique (GitHub Pages) : validation client-side
    if (!name.value || !USERS[name.value]) {
      error.value = 'Nom inconnu.'
      return
    }
    if (password.value !== PASSWORD) {
      error.value = 'Mot de passe incorrect.'
      return
    }
    const user = USERS[name.value]
    emit('login', { name: name.value, role: user.role, groups: user.groups })

  } finally {
    loading.value = false
  }
}
</script>
