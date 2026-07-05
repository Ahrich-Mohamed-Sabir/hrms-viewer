<!--
  CodeView.vue — Visionneuse de code + Fiches techniques
  ========================================================
  Layout 2 colonnes (sidebar + panneau principal).
  Le panneau principal a 2 onglets :
    • Code  : affichage syntax-highlighted avec numéros de ligne
    • Fiche : rôle du fichier, chemin complet, connexions vers autres fichiers
-->

<template>
  <div class="layout">

    <!-- ── SIDEBAR ─────────────────────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-user">
          <div class="sidebar-avatar">{{ initials }}</div>
          <div>
            <div class="sidebar-name">{{ session.name }}</div>
            <div class="sidebar-role">{{ session.role }}</div>
          </div>
        </div>
        <button class="btn-logout" @click="$emit('logout')" title="Déconnexion">↩</button>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in session.groups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <button
            v-for="file in group.files"
            :key="file.path"
            class="nav-file"
            :class="{ active: activeFile?.path === file.path }"
            @click="openFile(file)"
          >
            <span class="nav-file-icon">{{ fileIcon(file.name) }}</span>
            <span class="nav-file-name">{{ file.name }}</span>
          </button>
        </div>
      </nav>

      <div class="sidebar-footer">
        {{ totalFiles }} fichiers · HRMS 2026
      </div>
    </aside>

    <!-- ── PANNEAU PRINCIPAL ──────────────────────────────────────── -->
    <main class="main">

      <!-- Écran vide : aucun fichier sélectionné -->
      <div v-if="!activeFile" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>Sélectionnez un fichier dans la liste</p>
        <p class="empty-sub">{{ session.name }}</p>
      </div>

      <template v-else>

        <!-- ── En-tête : infos fichier + onglets ── -->
        <div class="code-header">
          <div class="code-file-info">
            <span class="code-icon">{{ fileIcon(activeFile.name) }}</span>
            <div>
              <div class="code-filename">{{ activeFile.name }}</div>
              <div class="code-path">{{ shortPath(activeFile.path) }}</div>
            </div>
          </div>

          <div class="code-meta">
            <!-- Badge de couche architecturale (Controller, Model, Vue…) -->
            <span v-if="activeFile.layer" class="code-layer">{{ activeFile.layer }}</span>
            <span v-if="lines && activeTab === 'code'" class="code-lines">{{ lines }} lignes</span>
            <span class="code-lang">{{ lang }}</span>

            <!-- Onglets Code / Fiche -->
            <div class="tabs">
              <button class="tab" :class="{ 'tab-active': activeTab === 'code' }"  @click="activeTab = 'code'">
                &lt;/&gt; Code
              </button>
              <button class="tab" :class="{ 'tab-active': activeTab === 'fiche' }" @click="activeTab = 'fiche'">
                ℹ Fiche
              </button>
            </div>

            <button v-if="activeTab === 'code'" class="btn-copy" @click="copyCode" :class="{ copied }">
              {{ copied ? '✓ Copié !' : '📋 Copier' }}
            </button>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- ONGLET CODE                                               -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="activeTab === 'code'">
          <div v-if="loadingFile" class="code-loading">Chargement…</div>
          <div v-else-if="fileError" class="code-error">{{ fileError }}</div>
          <div v-else class="code-wrap">
            <div class="line-numbers" aria-hidden="true">
              <span v-for="n in lines" :key="n">{{ n }}</span>
            </div>
            <pre class="code-pre"><code v-html="highlighted" /></pre>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- ONGLET FICHE                                              -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <div v-else class="fiche-wrap">

          <!-- Hero : nom + chemin complet -->
          <div class="fiche-hero">
            <div class="fiche-hero-icon">{{ fileIcon(activeFile.name) }}</div>
            <div class="fiche-hero-info">
              <h2 class="fiche-title">{{ activeFile.name }}</h2>
              <code class="fiche-fullpath">{{ activeFile.path }}</code>
            </div>
          </div>

          <!-- Description du rôle -->
          <div class="fiche-card" v-if="activeFile.description">
            <div class="fiche-card-label">Rôle dans le projet</div>
            <p class="fiche-desc">{{ activeFile.description }}</p>
          </div>

          <!-- Connexions avec autres fichiers -->
          <div class="fiche-card" v-if="activeFile.connections?.length">
            <div class="fiche-card-label">Communique avec</div>
            <div class="connections-grid">
              <div
                v-for="conn in activeFile.connections"
                :key="conn.name"
                class="conn-item"
                :class="{ 'conn-clickable': findFile(conn.name) }"
                @click="jumpToFile(conn.name)"
              >
                <div class="conn-top">
                  <span class="conn-icon">{{ fileIcon(conn.name) }}</span>
                  <span class="conn-name">{{ conn.name }}</span>
                </div>
                <div class="conn-how">→ {{ conn.how }}</div>
              </div>
            </div>
          </div>

          <!-- Guide du code : fonctions clés expliquées -->
          <div class="fiche-card" v-if="activeFile.guide?.length">
            <div class="fiche-card-label">Guide du code — fonctions & sections clés</div>
            <div class="guide-list">
              <div v-for="(item, i) in activeFile.guide" :key="i" class="guide-item">
                <div class="guide-fn">
                  <span class="guide-num">{{ i + 1 }}</span>
                  <code class="guide-fn-name">{{ item.fn }}</code>
                </div>
                <p class="guide-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Pas de métadonnées -->
          <div v-if="!activeFile.description && !activeFile.connections?.length && !activeFile.guide?.length" class="fiche-empty">
            Pas de fiche disponible pour ce fichier.
          </div>

        </div>
        <!-- fin onglet fiche -->

      </template>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps({ session: Object })
defineEmits(['logout'])

// ── État ────────────────────────────────────────────────────────────────────
const activeFile  = ref(null)
const rawCode     = ref('')
const loadingFile = ref(false)
const fileError   = ref('')
const activeTab   = ref('code') // 'code' | 'fiche'
const copied      = ref(false)

// ── Computed ────────────────────────────────────────────────────────────────
const initials = computed(() =>
  props.session.name.split(' ').slice(0, 2).map(w => w[0]).join('')
)

const totalFiles = computed(() =>
  props.session.groups.reduce((s, g) => s + g.files.length, 0)
)

const lines = computed(() =>
  rawCode.value ? rawCode.value.split('\n').length : 0
)

const extOf = name => name.split('.').pop().toLowerCase()

const lang = computed(() => {
  if (!activeFile.value) return ''
  const map = { php:'PHP', js:'JavaScript', vue:'Vue', css:'CSS',
                yml:'YAML', yaml:'YAML', json:'JSON', md:'Markdown',
                conf:'Config', sql:'SQL', sh:'Bash' }
  return map[extOf(activeFile.value.name)] || extOf(activeFile.value.name).toUpperCase()
})

const hljsLang = computed(() => {
  if (!activeFile.value) return 'plaintext'
  const map = { php:'php', js:'javascript', vue:'xml', css:'css',
                yml:'yaml', yaml:'yaml', json:'json', md:'markdown',
                conf:'nginx', sql:'sql', sh:'bash' }
  return map[extOf(activeFile.value.name)] || 'plaintext'
})

const highlighted = computed(() => {
  if (!rawCode.value) return ''
  try { return hljs.highlight(rawCode.value, { language: hljsLang.value }).value }
  catch { return hljs.highlightAuto(rawCode.value).value }
})

// ── Utilitaires ─────────────────────────────────────────────────────────────
function fileIcon(name) {
  const map = { php:'🐘', js:'🟨', vue:'💚', css:'🎨',
                yml:'🐳', yaml:'🐳', json:'📋', md:'📝',
                conf:'🔧', sql:'🗃️', sh:'⚙️' }
  return map[extOf(name)] || '📄'
}

function shortPath(p) {
  return p.replace(/\\/g, '/').replace(/^.*\/(hrm-laravel|hrm-frontend|docker)\//, '$1/')
}

// Cherche un fichier par nom dans tous les groupes de la session
function findFile(name) {
  for (const group of props.session.groups) {
    const f = group.files.find(f => f.name === name)
    if (f) return f
  }
  return null
}

// Navigue vers un fichier depuis la fiche (connexions cliquables)
function jumpToFile(name) {
  const file = findFile(name)
  if (file) openFile(file)
}

// ── Copie ────────────────────────────────────────────────────────────────────
async function copyCode() {
  if (!rawCode.value) return
  await navigator.clipboard.writeText(rawCode.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

watch(() => activeFile.value, () => { copied.value = false })

// ── Données baked (mode statique GitHub Pages) ──────────────────────────────
let bakedFiles = null

async function getBaked() {
  if (bakedFiles) return bakedFiles
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'files-data.json')
    bakedFiles = res.ok ? await res.json() : {}
  } catch { bakedFiles = {} }
  return bakedFiles
}

// ── Chargement d'un fichier ──────────────────────────────────────────────────
async function openFile(file) {
  if (activeFile.value?.path === file.path) return
  activeFile.value  = file
  rawCode.value     = ''
  fileError.value   = ''
  loadingFile.value = true
  activeTab.value   = 'code'

  try {
    // Mode serveur (local) : appel à server.js
    const res  = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    rawCode.value = data.content
  } catch {
    // Mode statique (GitHub Pages) : fichier baked dans files-data.json
    const baked = await getBaked()
    rawCode.value = baked[file.path] || `// Fichier non disponible : ${file.path}`
  } finally {
    loadingFile.value = false
  }
}
</script>

<style scoped>
/* ── Onglets ──────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.tab {
  padding: .3rem .85rem;
  font-size: .8rem;
  font-weight: 600;
  border: none;
  background: var(--surface2);
  color: var(--muted);
  cursor: pointer;
  transition: background .12s, color .12s;
  white-space: nowrap;
}
.tab:hover { background: var(--surface); color: var(--text); }
.tab-active { background: var(--primary) !important; color: #fff !important; }

/* Badge couche architecturale */
.code-layer {
  font-size: .72rem;
  font-weight: 700;
  padding: .2rem .65rem;
  border-radius: 99px;
  background: rgba(99,102,241,.15);
  color: #a5b4fc;
  white-space: nowrap;
}

/* ── Fiche ────────────────────────────────────────────────────────── */
.fiche-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.fiche-hero {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.fiche-hero-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}
.fiche-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: .35rem;
}
.fiche-fullpath {
  font-size: .75rem;
  color: var(--muted);
  font-family: 'Fira Code', Consolas, monospace;
  word-break: break-all;
}

.fiche-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.1rem 1.4rem;
}
.fiche-card-label {
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--muted);
  margin-bottom: .7rem;
}
.fiche-desc {
  font-size: .92rem;
  color: var(--text);
  line-height: 1.7;
}

/* ── Connexions ───────────────────────────────────────────────────── */
.connections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: .7rem;
}
.conn-item {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: .75rem 1rem;
  transition: border-color .15s, background .15s;
}
.conn-clickable {
  cursor: pointer;
}
.conn-clickable:hover {
  border-color: var(--accent);
  background: rgba(79,70,229,.1);
}
.conn-top {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: .35rem;
}
.conn-icon { font-size: 1rem; flex-shrink: 0; }
.conn-name {
  font-size: .85rem;
  font-weight: 600;
  color: var(--accent);
  font-family: 'Fira Code', Consolas, monospace;
}
.conn-how {
  font-size: .78rem;
  color: var(--muted);
  padding-left: 1.5rem;
  line-height: 1.4;
}

/* ── Guide du code ─────────────────────────────────────────── */
.guide-list {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}
.guide-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: .85rem 1rem;
}
.guide-fn {
  display: flex;
  align-items: center;
  gap: .65rem;
  margin-bottom: .45rem;
}
.guide-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: .7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.guide-fn-name {
  font-size: .82rem;
  font-weight: 700;
  color: var(--accent);
  font-family: 'Fira Code', Consolas, monospace;
}
.guide-desc {
  font-size: .875rem;
  color: var(--text);
  line-height: 1.65;
  padding-left: 1.85rem;
}

.fiche-empty {
  color: var(--muted);
  font-style: italic;
  text-align: center;
  padding: 3rem;
}
</style>
