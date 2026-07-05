/**
 * scripts/prebake.js — Bake les fichiers HRMS dans public/files-data.json
 * =========================================================================
 * À lancer UNE FOIS avant npm run build:static
 * Lit tous les fichiers définis dans files-config.js depuis le disque local,
 * et les sauvegarde dans public/files-data.json.
 * Le build Vite inclut ce JSON → le site déployé n'a plus besoin de server.js.
 *
 * Usage : node scripts/prebake.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { USERS } from '../files-config.js'

const data = {}
let found = 0
let missing = 0

for (const [, user] of Object.entries(USERS)) {
  for (const group of user.groups) {
    for (const file of group.files) {
      // Normalise en chemin Windows
      const winPath = file.path.replace(/\//g, '\\')

      if (existsSync(winPath)) {
        try {
          data[file.path] = readFileSync(winPath, 'utf8')
          found++
          console.log(`  ✅ ${file.name}`)
        } catch (e) {
          data[file.path] = `// Erreur de lecture : ${e.message}`
          missing++
          console.log(`  ⚠ ${file.name} — ${e.message}`)
        }
      } else {
        data[file.path] = `// Fichier non trouvé sur ce poste : ${file.path}`
        missing++
        console.log(`  ✗ ${file.name} — introuvable`)
      }
    }
  }
}

writeFileSync('./public/files-data.json', JSON.stringify(data))
console.log(`\n  ✅ ${found} fichiers baked  •  ${missing} manquants`)
console.log(`  → public/files-data.json prêt pour le build\n`)
