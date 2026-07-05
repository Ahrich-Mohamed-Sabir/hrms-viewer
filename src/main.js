/**
 * main.js — Point d'entrée de l'application Vue 3
 * =================================================
 * Ce fichier est le premier exécuté par le navigateur (via index.html).
 * Son seul rôle : créer l'application Vue et la "monter" dans le DOM.
 *
 * Flux de démarrage :
 *   index.html charge main.js
 *   → createApp(App) crée l'instance Vue avec App.vue comme composant racine
 *   → .mount('#app') injecte l'interface dans la div#app de index.html
 */

import { createApp } from 'vue' // La fonction principale de Vue 3 pour créer une app
import './style.css'             // CSS global : variables de couleur, login, sidebar, code
import App from './App.vue'      // Composant racine — contient toute la logique de navigation

// createApp() initialise Vue avec App.vue comme composant racine
// .mount('#app') attache l'application à <div id="app"> dans index.html
createApp(App).mount('#app')
