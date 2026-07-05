/**
 * server.js — Serveur Node.js / Express (backend du Code Viewer)
 * ===============================================================
 * Rôle : servir le frontend Vue compilé ET exposer 2 endpoints API sécurisés.
 *
 * Pourquoi un serveur Node séparé ?
 *   Le frontend Vue (dans dist/) est statique — il ne peut pas lire des fichiers
 *   du disque par lui-même (sécurité navigateur). Le serveur Node agit comme
 *   intermédiaire : il lit le fichier côté serveur et le renvoie en JSON.
 *
 * Démarrage : node server.js  (ou via START.bat)
 * Port      : 3030
 */

// ── Imports ────────────────────────────────────────────────────────────────
import express from 'express'          // Framework HTTP minimaliste pour Node.js
import { readFileSync, existsSync } from 'fs'  // Lecture de fichiers sur le disque
import { createServer } from 'net'     // Utilisé pour détecter si le port est libre
import { networkInterfaces } from 'os' // Pour obtenir l'IP locale du PC (affichage)
import { fileURLToPath } from 'url'    // Nécessaire pour reconstruire __dirname en ESModule
import { dirname, join } from 'path'   // Manipulation de chemins de fichiers
import { USERS, ALL_ALLOWED } from './files-config.js' // Config des utilisateurs et fichiers autorisés

// En ESModule (type:"module"), __dirname n'existe pas nativement → on le reconstruit
const __dirname = dirname(fileURLToPath(import.meta.url))

const app  = express() // Crée l'application Express
const PORT = 3030      // Port d'écoute du serveur

// ── Middlewares globaux ────────────────────────────────────────────────────
app.use(express.json())                         // Parse automatiquement le body JSON des requêtes POST
app.use(express.static(join(__dirname, 'dist'))) // Sert les fichiers statiques du build Vue (dist/)

// ── POST /api/login ────────────────────────────────────────────────────────
/**
 * Authentification simplifiée : nom dans la liste + mot de passe partagé
 * Retourne les groupes de fichiers de l'utilisateur si succès.
 *
 * Pas de JWT ni de session — le frontend stocke la réponse dans sessionStorage.
 * Ce viewer n'est pas exposé sur internet (usage local/LAN), donc suffisant.
 */
app.post('/api/login', (req, res) => {
  const { name, password } = req.body || {}

  // Vérifie que le nom existe dans USERS (files-config.js)
  if (!name || !USERS[name]) return res.status(401).json({ error: 'Nom inconnu.' })

  // Mot de passe partagé pour toute l'équipe
  if (password !== 'sabsab12') return res.status(401).json({ error: 'Mot de passe incorrect.' })

  const user = USERS[name]
  // Renvoie le nom, le rôle et les groupes de fichiers → utilisé par la sidebar Vue
  res.json({ name, role: user.role, groups: user.groups })
})

// ── GET /api/file?path=... ─────────────────────────────────────────────────
/**
 * Lecture sécurisée d'un fichier du disque.
 *
 * Sécurité en 2 étapes :
 *   1. Le chemin doit être dans ALL_ALLOWED (liste blanche de files-config.js)
 *      → empêche de lire C:\Windows\System32\... ou n'importe quoi d'autre
 *   2. Le fichier doit exister physiquement sur le disque
 *
 * Retourne : { content: "..." } avec le texte brut du fichier
 */
app.get('/api/file', (req, res) => {
  const raw  = req.query.path || ''           // Chemin reçu dans l'URL (?path=C:/...)
  const norm = raw.replace(/\//g, '\\')       // Normalise les slashes → séparateur Windows

  // Vérification liste blanche : rejette tout ce qui n'est pas dans files-config.js
  if (!ALL_ALLOWED.has(norm)) return res.status(403).json({ error: 'Accès refusé.' })

  // Vérifie que le fichier existe vraiment sur le disque
  if (!existsSync(norm)) return res.status(404).json({ error: 'Fichier introuvable.' })

  try {
    const content = readFileSync(norm, 'utf8') // Lit le fichier en texte UTF-8
    res.json({ content })
  } catch {
    res.status(500).json({ error: 'Erreur de lecture.' })
  }
})

// ── SPA Fallback ───────────────────────────────────────────────────────────
/**
 * Pour toutes les autres URLs (ex: /login, /code), renvoie index.html.
 * C'est ce qui permet à Vue Router de gérer la navigation côté client.
 * Sans ça, un refresh sur /code donnerait une 404 serveur.
 */
app.get('/{*path}', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

// ── Utilitaire : IP locale ─────────────────────────────────────────────────
/**
 * Parcourt les interfaces réseau du PC pour trouver l'IP locale (type 192.168.x.x).
 * Exclut "loopback" (127.0.0.1) pour n'afficher que l'adresse LAN.
 * Permet aux autres membres de l'équipe de se connecter via le réseau local.
 */
function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost' // Fallback si aucune interface LAN trouvée
}

// ── Démarrage ──────────────────────────────────────────────────────────────
// '0.0.0.0' = écoute sur toutes les interfaces réseau (pas seulement localhost)
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP()
  console.log('\n  HRMS Code Viewer')
  console.log('  ════════════════════════════════')
  console.log(`  Local   → http://localhost:${PORT}`)
  console.log(`  Réseau  → http://${ip}:${PORT}   ← partager cette URL`)
  console.log('  ════════════════════════════════\n')
})
