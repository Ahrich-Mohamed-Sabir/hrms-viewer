<!--
  App.vue — Composant racine (Root Component)
  ============================================
  C'est le "chef d'orchestre" de l'interface.
  Il ne contient pas de vraie UI — il décide juste QUOI afficher :
    • Si l'utilisateur n'est pas connecté  → affiche <LoginView>
    • Si l'utilisateur est connecté        → affiche <CodeView>

  La session est stockée dans sessionStorage (pas localStorage) :
    → SessionStorage = effacé quand on ferme l'onglet (plus sécurisé pour un viewer de code)
    → LocalStorage  = persiste même après fermeture du navigateur
-->

<template>
  <!--
    v-if / v-else : directive Vue — affichage conditionnel
    !session = session est null → non connecté → on montre LoginView
    @login="onLogin" : écoute l'événement 'login' émis par LoginView quand auth réussit
  -->
  <LoginView v-if="!session" @login="onLogin" />

  <!--
    :session="session" : passe l'objet session en prop à CodeView
    (name, role, groups des fichiers)
    @logout="logout" : écoute l'événement 'logout' émis par CodeView (bouton ↩)
  -->
  <CodeView  v-else :session="session" @logout="logout" />
</template>

<script setup>
/**
 * <script setup> = syntaxe "Composition API" de Vue 3
 * Avantages vs Options API (data/methods/computed) :
 *   - Moins de boilerplate
 *   - Meilleure inférence TypeScript
 *   - Variables déclarées directement accessibles dans le template
 */

import { ref } from 'vue'           // ref() = variable réactive (Vue re-rend si elle change)
import LoginView from './views/LoginView.vue'
import CodeView  from './views/CodeView.vue'

// ── Session persistante ────────────────────────────────────────────────────
// Au chargement, on vérifie si une session existe déjà dans sessionStorage
// (ex: page refresh) — évite de re-login à chaque F5
const saved   = sessionStorage.getItem('cv_session')         // Lit la clé 'cv_session'
const session = ref(saved ? JSON.parse(saved) : null)        // null = pas connecté

// ── Callbacks ──────────────────────────────────────────────────────────────

/**
 * onLogin(data) — appelé quand LoginView émet 'login'
 * data = { name, role, groups } renvoyé par /api/login
 * → Sauvegarde en mémoire réactive ET dans sessionStorage (survit au F5)
 */
function onLogin(data) {
  session.value = data
  sessionStorage.setItem('cv_session', JSON.stringify(data))
}

/**
 * logout() — appelé quand CodeView émet 'logout' (bouton ↩ dans la sidebar)
 * → Vide la session réactive ET supprime de sessionStorage
 * → Vue re-rend automatiquement et affiche LoginView
 */
function logout() {
  session.value = null
  sessionStorage.removeItem('cv_session')
}
</script>
