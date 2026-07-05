const BASE = 'C:/wamp64/www/php'

export const USERS = {

  // ════════════════════════════════════════════════════════════
  // AHRICH Mohamed Saber — Backend Lead
  // ════════════════════════════════════════════════════════════
  'AHRICH Mohamed Saber': {
    role: 'Backend Lead — Laravel v2 + Docker',
    groups: [
      {
        label: 'Routes API',
        files: [
          {
            name: 'api.php',
            path: `${BASE}/hrm-laravel/routes/api.php`,
            layer: 'Route',
            description: 'Point d\'entrée de toutes les routes REST de l\'API Laravel. Mappe chaque URL vers le contrôleur correspondant. Les routes protégées exigent un token Sanctum valide.',
            connections: [
              { name: 'AuthController.php',      how: 'délègue login / logout / register' },
              { name: 'EmployeeController.php',   how: 'délègue CRUD employés' },
              { name: 'ProjectController.php',    how: 'délègue CRUD projets' },
              { name: 'ReviewController.php',     how: 'délègue CRUD évaluations' },
              { name: 'SkillController.php',      how: 'délègue CRUD compétences' },
              { name: 'DepartmentController.php', how: 'délègue CRUD départements' },
              { name: 'ChatController.php',       how: 'délègue POST /chat (streaming SSE)' },
            ],
            guide: [
              { fn: 'Route::post(\'/login\')', desc: 'Route publique — aucun middleware. Reçoit email + password, retourne un token Sanctum si valide. C\'est la seule route accessible sans être connecté.' },
              { fn: 'Route::middleware(\'auth:sanctum\')', desc: 'Groupe de routes protégées. Laravel vérifie automatiquement le header "Authorization: Bearer <token>" avant d\'exécuter le controller. Si le token est absent ou invalide → 401.' },
              { fn: 'Route::apiResource()', desc: 'Raccourci Laravel qui génère automatiquement 7 routes (index, store, show, update, destroy…) pour une ressource. Une seule ligne remplace 7 Route::get/post/put/delete.' },
              { fn: 'Route::post(\'/chat\')', desc: 'Route spéciale pour le chatbot. Retourne un flux SSE (text/event-stream) au lieu d\'un JSON classique — les tokens arrivent en temps réel au lieu d\'attendre la réponse complète.' },
            ]
          },
          {
            name: 'console.php',
            path: `${BASE}/hrm-laravel/routes/console.php`,
            layer: 'Scheduler',
            description: 'Déclare les tâches planifiées (Scheduler Laravel). Déclenche automatiquement le ChatCorrect toutes les minutes pour analyser les feedbacks négatifs et améliorer le chatbot.',
            connections: [
              { name: 'ChatController.php', how: 'appelle ChatCorrect() toutes les minutes' },
            ],
            guide: [
              { fn: 'Schedule::call()->everyMinute()', desc: 'Laravel Scheduler — équivalent d\'un cron job. Cette ligne dit : "appelle cette fonction toutes les minutes". C\'est le moteur de la boucle d\'apprentissage du chatbot.' },
              { fn: 'ChatCorrect()', desc: 'Fonction dans ChatController qui lit les feedbacks 👎 de la table chat_feedback, envoie chaque mauvaise réponse à qwen2.5:7b pour qu\'il propose une meilleure version, puis sauvegarde dans chat_learned.' },
            ]
          },
        ]
      },
      {
        label: 'Controllers',
        files: [
          {
            name: 'AuthController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/AuthController.php`,
            layer: 'Controller',
            description: 'Gère l\'authentification via Laravel Sanctum. Génère un token API à la connexion, le révoque à la déconnexion. Crée un User + un Employee lié à l\'inscription.',
            connections: [
              { name: 'User.php',    how: 'crée et authentifie les utilisateurs' },
              { name: 'api.php',     how: 'exposé sur POST /login, /logout, /register' },
              { name: 'auth.js',     how: 'le store Pinia appelle ces routes' },
            ],
            guide: [
              { fn: 'login(Request $request)', desc: 'Reçoit email + password. Utilise Auth::attempt() pour vérifier les credentials en base. Si succès : génère un token Sanctum avec createToken() et le retourne en JSON. Le frontend stocke ce token et l\'envoie dans chaque requête suivante.' },
              { fn: 'logout(Request $request)', desc: 'Révoque uniquement le token courant (celui envoyé dans la requête). $request->user()->currentAccessToken()->delete() — l\'utilisateur reste en base mais son token est invalide, donc il ne peut plus appeler l\'API.' },
              { fn: 'register(Request $request)', desc: 'Valide les données (email unique, password min 8 chars), crée un User avec password hashé (bcrypt automatique via Laravel), puis crée un Employee lié avec les infos supplémentaires.' },
              { fn: 'me(Request $request)', desc: 'Retourne les infos de l\'utilisateur connecté ($request->user()). Utilisé par le frontend au démarrage pour vérifier si le token stocké est encore valide.' },
            ]
          },
          {
            name: 'EmployeeController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/EmployeeController.php`,
            layer: 'Controller',
            description: 'CRUD complet des employés. Gère l\'upload de photo, la synchronisation des compétences (many-to-many) et les filtres de recherche avancés.',
            connections: [
              { name: 'Employee.php', how: 'modèle Eloquent principal' },
              { name: 'Skill.php',    how: 'synchronise les compétences via pivot' },
              { name: 'api.php',      how: 'exposé sur /employees' },
              { name: 'employee.js',  how: 'le store Pinia appelle ces endpoints' },
            ],
            guide: [
              { fn: 'index(Request $request)', desc: 'Liste tous les employés avec filtres optionnels (département, statut, compétence). Utilise Eloquent with() pour charger les relations en une seule requête SQL (évite le problème N+1). Retourne un JSON paginé.' },
              { fn: 'store(Request $request)', desc: 'Crée un nouvel employé. Valide les données avec les règles Laravel (required, email, min…). Si une photo est envoyée ($request->hasFile(\'photo\')), la sauvegarde dans storage/public/employees/ et stocke le chemin en base.' },
              { fn: 'update(Request $request, Employee $employee)', desc: 'Met à jour un employé existant. Laravel injecte automatiquement l\'objet Employee depuis l\'ID dans l\'URL (Route Model Binding). syncSkills() met à jour la table pivot employee_skill avec les nouvelles compétences.' },
              { fn: 'destroy(Employee $employee)', desc: 'Supprime l\'employé et toutes ses relations (grâce aux cascades définies dans le modèle). Supprime aussi la photo du disque si elle existe.' },
            ]
          },
          {
            name: 'ProjectController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/ProjectController.php`,
            layer: 'Controller',
            description: 'CRUD des projets + gestion des affectations d\'employés (ajout/retrait de membres). Calcule les workloads pour savoir qui est disponible.',
            connections: [
              { name: 'Project.php',  how: 'modèle Eloquent principal' },
              { name: 'Employee.php', how: 'affectations via table pivot' },
              { name: 'api.php',      how: 'exposé sur /projects' },
              { name: 'project.js',   how: 'le store Pinia appelle ces endpoints' },
            ],
            guide: [
              { fn: 'index()', desc: 'Liste tous les projets avec leurs membres. Le with([\'employees\']) charge les employés assignés en une seule requête SQL JOIN — sans ça, Laravel ferait une requête par projet (problème N+1).' },
              { fn: 'addMember(Project $project, Employee $employee)', desc: 'Ajoute un employé au projet via la table pivot employee_project. $project->employees()->attach($employee->id) — Eloquent gère l\'insertion dans la table intermédiaire sans SQL manuel.' },
              { fn: 'removeMember()', desc: 'Retire un employé du projet. detach() supprime uniquement la ligne dans la table pivot, pas l\'employé lui-même.' },
              { fn: 'workloads()', desc: 'Calcule pour chaque employé le nombre de projets actifs qu\'il a. Utilisé par le chatbot pour répondre à "qui est disponible ?" et par le frontend pour afficher les indicateurs de charge.' },
            ]
          },
          {
            name: 'ReviewController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/ReviewController.php`,
            layer: 'Controller',
            description: 'Gestion des évaluations de performance. Accessible aux managers et admins uniquement via middleware RBAC.',
            connections: [
              { name: 'Review.php',   how: 'modèle Eloquent principal' },
              { name: 'Employee.php', how: 'chaque évaluation cible un employé' },
              { name: 'api.php',      how: 'exposé sur /reviews' },
            ],
            guide: [
              { fn: 'store(Request $request)', desc: 'Crée une nouvelle évaluation. Sauvegarde la note (1-5), le commentaire et l\'ID de l\'évaluateur (manager connecté via $request->user()). La date est générée automatiquement par Laravel (timestamps).' },
              { fn: 'index(Request $request)', desc: 'Retourne les évaluations selon le rôle : un admin voit tout, un manager voit les évaluations de son département, un employé voit uniquement les siennes. Le filtre est appliqué via des conditions Eloquent where().' },
            ]
          },
          {
            name: 'SkillController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/SkillController.php`,
            layer: 'Controller',
            description: 'CRUD du référentiel de compétences (Python, React, Management…). Les compétences créées ici sont ensuite assignées aux employés.',
            connections: [
              { name: 'Skill.php',   how: 'modèle Eloquent principal' },
              { name: 'api.php',     how: 'exposé sur /skills' },
            ],
            guide: [
              { fn: 'index()', desc: 'Retourne toutes les compétences disponibles, avec optionnellement le nombre d\'employés qui possèdent chacune. Utilisé par le formulaire employé pour proposer la liste des compétences à cocher.' },
              { fn: 'store() / update() / destroy()', desc: 'CRUD standard. Avant de supprimer une compétence, vérifie qu\'aucun employé ne l\'a encore pour éviter les erreurs de clé étrangère.' },
            ]
          },
          {
            name: 'DepartmentController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/DepartmentController.php`,
            layer: 'Controller',
            description: 'Gestion des départements (IT, RH, Finance…). Retourne aussi le nombre d\'employés par département pour les stats.',
            connections: [
              { name: 'Department.php', how: 'modèle Eloquent principal' },
              { name: 'Employee.php',   how: 'relation hasMany — employés du département' },
              { name: 'api.php',        how: 'exposé sur /departments' },
            ],
            guide: [
              { fn: 'index()', desc: 'Retourne tous les départements avec withCount(\'employees\') — Eloquent ajoute automatiquement un champ employees_count sans écrire de SQL manuellement.' },
            ]
          },
          {
            name: 'DeviceController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/DeviceController.php`,
            layer: 'Controller',
            description: 'Suivi des équipements (laptops, badges) assignés aux employés. Utile lors des départs pour inventorier le matériel à récupérer.',
            connections: [
              { name: 'Employee.php', how: 'un équipement appartient à un employé' },
              { name: 'api.php',      how: 'exposé sur /devices' },
            ],
            guide: [
              { fn: 'assignTo(Employee $employee)', desc: 'Assigne un équipement à un employé en mettant à jour employee_id. Si l\'équipement était assigné à quelqu\'un d\'autre, l\'ancienne assignation est automatiquement remplacée.' },
              { fn: 'byEmployee(Employee $employee)', desc: 'Liste tous les équipements d\'un employé donné. Utilisé lors d\'un départ RH pour générer la liste du matériel à récupérer.' },
            ]
          },
        ]
      },
      {
        label: 'Models Eloquent',
        files: [
          {
            name: 'User.php',
            path: `${BASE}/hrm-laravel/app/Models/User.php`,
            layer: 'Model',
            description: 'Compte utilisateur avec authentification Sanctum et gestion des rôles (admin / manager / employee) pour le RBAC.',
            connections: [
              { name: 'Employee.php',           how: 'hasOne — chaque user a un profil employé' },
              { name: 'PersonalAccessToken.php', how: 'hasManyTokens via Sanctum' },
              { name: 'AuthController.php',      how: 'créé et authentifié par ce controller' },
            ],
            guide: [
              { fn: '$fillable', desc: 'Liste des champs que Laravel autorise à remplir en masse (Employee::create([...])). Protège contre les attaques "mass assignment" — tout champ non listé est ignoré même si envoyé dans la requête.' },
              { fn: '$hidden', desc: 'Champs exclus automatiquement des réponses JSON (password, remember_token). Même si tu fais return $user, le mot de passe n\'apparaît jamais dans l\'API.' },
              { fn: 'HasApiTokens (trait)', desc: 'Trait Sanctum — ajoute les méthodes createToken(), tokens() et currentAccessToken() à l\'objet User. Sans ce trait, Sanctum ne fonctionne pas.' },
              { fn: 'employee() : HasOne', desc: 'Relation Eloquent — User::find(1)->employee retourne automatiquement l\'objet Employee lié sans écrire de SQL JOIN.' },
            ]
          },
          {
            name: 'Employee.php',
            path: `${BASE}/hrm-laravel/app/Models/Employee.php`,
            layer: 'Model',
            description: 'Entité centrale du HRMS. Pivot de toutes les relations : département, compétences (many-to-many), projets, évaluations, équipements.',
            connections: [
              { name: 'Department.php', how: 'belongsTo — appartient à un département' },
              { name: 'Skill.php',      how: 'belongsToMany — via table pivot employee_skill' },
              { name: 'Project.php',    how: 'belongsToMany — via table pivot employee_project' },
              { name: 'Review.php',     how: 'hasMany — peut avoir plusieurs évaluations' },
              { name: 'User.php',       how: 'belongsTo — lié à un compte utilisateur' },
            ],
            guide: [
              { fn: 'skills() : BelongsToMany', desc: 'Relation many-to-many avec la table pivot employee_skill qui contient en plus le niveau de maîtrise (débutant/intermédiaire/expert). Employee::find(1)->skills retourne toutes les compétences avec leur niveau.' },
              { fn: 'projects() : BelongsToMany', desc: 'Un employé peut être sur plusieurs projets simultanément, un projet a plusieurs employés. La table pivot employee_project gère cette relation sans dupliquer les données.' },
              { fn: 'reviews() : HasMany', desc: 'Un employé peut avoir plusieurs évaluations dans le temps. HasMany = "un-vers-plusieurs" — chaque Review a un employee_id qui pointe vers cet employé.' },
              { fn: 'getFullNameAttribute()', desc: 'Accesseur Eloquent — ajoute un attribut calculé "full_name" qui n\'existe pas en base. Employee::find(1)->full_name retourne "Prénom Nom" automatiquement.' },
            ]
          },
          {
            name: 'Project.php',
            path: `${BASE}/hrm-laravel/app/Models/Project.php`,
            layer: 'Model',
            description: 'Un projet avec dates, statut et équipe. La relation many-to-many avec Employee permet de gérer les affectations.',
            connections: [
              { name: 'Employee.php',          how: 'belongsToMany — membres de l\'équipe projet' },
              { name: 'ProjectController.php', how: 'manipulé par ce controller' },
            ],
            guide: [
              { fn: 'employees() : BelongsToMany', desc: 'Liste tous les employés assignés à ce projet via la table pivot employee_project. Project::find(1)->employees retourne une Collection d\'objets Employee.' },
              { fn: '$casts[\'start_date\']', desc: 'Cast automatique — Laravel convertit la date stockée en chaîne MySQL en objet Carbon (classe PHP de gestion de dates). Permet $project->start_date->diffInDays(now()) sans conversion manuelle.' },
            ]
          },
          {
            name: 'Review.php',
            path: `${BASE}/hrm-laravel/app/Models/Review.php`,
            layer: 'Model',
            description: 'Évaluation de performance d\'un employé (note 1-5, commentaire, période).',
            connections: [
              { name: 'Employee.php',         how: 'belongsTo — concerne un employé' },
              { name: 'ReviewController.php', how: 'manipulé par ce controller' },
            ],
            guide: [
              { fn: 'employee() : BelongsTo', desc: 'La relation inverse de hasMany. Review::find(1)->employee retourne l\'objet Employee concerné. Eloquent utilise employee_id stocké dans la table reviews pour faire le JOIN automatiquement.' },
              { fn: '$casts[\'rating\']', desc: 'Cast la note en entier (integer) pour pouvoir faire des calculs (moyenne, min, max) directement en PHP sans conversion.' },
            ]
          },
          {
            name: 'Skill.php',
            path: `${BASE}/hrm-laravel/app/Models/Skill.php`,
            layer: 'Model',
            description: 'Compétence du référentiel RH. Reliée aux employés par many-to-many avec niveau de maîtrise dans la table pivot.',
            connections: [
              { name: 'Employee.php',      how: 'belongsToMany — partagée entre plusieurs employés' },
              { name: 'SkillController.php', how: 'manipulé par ce controller' },
            ],
            guide: [
              { fn: 'employees() : BelongsToMany', desc: 'Relation inverse de Employee::skills(). Skill::find(1)->employees retourne tous les employés qui ont cette compétence. Avec ->withPivot(\'level\') pour récupérer le niveau depuis la table pivot.' },
            ]
          },
          {
            name: 'Department.php',
            path: `${BASE}/hrm-laravel/app/Models/Department.php`,
            layer: 'Model',
            description: 'Département de l\'entreprise. Regroupe les employés. Utilisé dans les filtres et stats du chatbot.',
            connections: [
              { name: 'Employee.php',           how: 'hasMany — regroupe plusieurs employés' },
              { name: 'DepartmentController.php', how: 'manipulé par ce controller' },
              { name: 'ChatController.php',      how: 'interrogé pour les stats par département' },
            ],
            guide: [
              { fn: 'employees() : HasMany', desc: 'Un département a plusieurs employés. Department::find(1)->employees retourne tous les employés de ce département. Eloquent sait utiliser department_id dans la table employees pour faire la jointure.' },
            ]
          },
          {
            name: 'PersonalAccessToken.php',
            path: `${BASE}/hrm-laravel/app/Models/PersonalAccessToken.php`,
            layer: 'Model',
            description: 'Extension du modèle Sanctum pour personnaliser le stockage et la validation des tokens d\'API.',
            connections: [
              { name: 'User.php',           how: 'appartient à un utilisateur' },
              { name: 'AuthController.php', how: 'créé au login, révoqué au logout' },
            ],
            guide: [
              { fn: 'extends Sanctum\\PersonalAccessToken', desc: 'Hérite du modèle Sanctum de base et permet de le personnaliser : ajouter des champs (last_used_ip, device_name), overrider la validation, ou changer la table de stockage.' },
              { fn: 'Sanctum::usePersonalAccessTokenModel()', desc: 'Dans AuthServiceProvider : indique à Sanctum d\'utiliser ce modèle personnalisé au lieu du modèle par défaut. Sans cette ligne, les personnalisations ne seraient pas prises en compte.' },
            ]
          },
        ]
      },
      {
        label: 'Docker',
        files: [
          {
            name: 'docker-compose.yml',
            path: `${BASE}/docker-compose.yml`,
            layer: 'Infrastructure',
            description: 'Orchestre les 5 conteneurs du projet en un seul réseau Docker : db, api, scheduler, frontend, phpmyadmin. Un seul fichier remplace 5 installations manuelles.',
            connections: [
              { name: 'Dockerfile (api)',   how: 'build du conteneur api' },
              { name: 'Dockerfile (front)', how: 'build du conteneur frontend' },
              { name: 'nginx.conf',         how: 'monté dans le conteneur frontend' },
              { name: 'apache.conf',        how: 'monté dans le conteneur api' },
            ],
            guide: [
              { fn: 'services: db', desc: 'Conteneur MySQL 8. Le volume db_data persiste les données sur le disque — sans ça, toute la base serait perdue à chaque docker compose down. healthcheck garantit que les autres services attendent que MySQL soit prêt.' },
              { fn: 'services: api', desc: 'Conteneur Laravel/Apache. environment: passe les variables d\'environnement (DB_HOST, OLLAMA_URL…) directement au conteneur — Laravel les lit via env(\'DB_HOST\'). depends_on: db attend que MySQL soit healthy.' },
              { fn: 'services: scheduler', desc: 'Même image que api, mais son command est /scheduler-entrypoint.sh qui lance artisan schedule:run en boucle infinie. Séparé pour ne pas bloquer le conteneur api principal.' },
              { fn: 'extra_hosts: host.docker.internal', desc: 'Permet au conteneur Docker d\'accéder à localhost de la machine hôte (où Ollama tourne). Sans ça, http://localhost:11434 ne fonctionnerait pas depuis l\'intérieur du conteneur.' },
            ]
          },
          {
            name: 'Dockerfile (api)',
            path: `${BASE}/docker/v2-api/Dockerfile`,
            layer: 'Infrastructure',
            description: 'Image Docker pour le backend Laravel. Base php:8.3-apache. Installe les extensions, copie le code, installe Composer, configure les permissions.',
            connections: [
              { name: 'apache.conf',        how: 'copié dans sites-available d\'Apache' },
              { name: 'docker-compose.yml', how: 'référencé dans les services api et scheduler' },
            ],
            guide: [
              { fn: 'FROM php:8.3-apache', desc: 'Image de base officielle PHP avec Apache préinstallé. On part de cette base pour ne pas avoir à installer PHP + Apache manuellement.' },
              { fn: 'RUN docker-php-ext-install pdo_mysql', desc: 'Installe l\'extension PDO MySQL — indispensable pour que Laravel puisse se connecter à MySQL. Sans cette ligne, toute requête DB lancerait une erreur fatale.' },
              { fn: 'RUN composer install --no-dev', desc: '--no-dev exclut les dépendances de développement (PHPUnit, etc.) de l\'image de production. Réduit la taille de l\'image et la surface d\'attaque.' },
              { fn: 'RUN chown -R www-data:www-data storage bootstrap/cache', desc: 'Apache tourne sous l\'utilisateur www-data. Ces dossiers doivent lui appartenir pour que Laravel puisse écrire les logs, le cache et les sessions.' },
            ]
          },
          {
            name: 'apache.conf',
            path: `${BASE}/docker/v2-api/apache.conf`,
            layer: 'Infrastructure',
            description: 'VirtualHost Apache pour Laravel. Pointe sur public/ et active AllowOverride pour les .htaccess. Sans ce fichier, Apache servirait les fichiers bruts.',
            connections: [
              { name: 'Dockerfile (api)', how: 'copié par ce Dockerfile' },
              { name: 'api.php',          how: 'toutes les requêtes passent par public/index.php → routes/api.php' },
            ],
            guide: [
              { fn: 'DocumentRoot /var/www/html/public', desc: 'Pointe Apache vers le dossier public/ de Laravel — le seul dossier accessible depuis le web. Le reste du code (app/, config/, .env) est hors de portée du navigateur.' },
              { fn: 'AllowOverride All', desc: 'Autorise les fichiers .htaccess à modifier la config Apache. Laravel utilise .htaccess pour rediriger toutes les requêtes vers index.php (Front Controller pattern).' },
            ]
          },
          {
            name: 'Dockerfile (front)',
            path: `${BASE}/docker/v2-frontend/Dockerfile`,
            layer: 'Infrastructure',
            description: 'Build multi-étapes Vue → Nginx. Étape 1 : node:20 compile le bundle. Étape 2 : nginx:alpine sert uniquement dist/. Image finale légère sans Node.',
            connections: [
              { name: 'nginx.conf',         how: 'copié comme config Nginx principale' },
              { name: 'docker-compose.yml', how: 'référencé dans le service frontend' },
            ],
            guide: [
              { fn: 'FROM node:20-alpine AS builder', desc: 'Première étape nommée "builder". On installe Node et toutes les dépendances npm pour compiler le code Vue. Cette image fait ~500 MB.' },
              { fn: 'RUN npm run build', desc: 'Vite compile tout le code Vue (src/) en fichiers statiques optimisés dans dist/ (HTML + JS minifié + CSS minifié).' },
              { fn: 'FROM nginx:alpine', desc: 'Deuxième étape — repart d\'une image Nginx vierge (~25 MB). COPY --from=builder copie uniquement dist/ depuis la première étape. Node et node_modules ne sont PAS inclus dans l\'image finale.' },
            ]
          },
          {
            name: 'nginx.conf',
            path: `${BASE}/docker/v2-frontend/nginx.conf`,
            layer: 'Infrastructure',
            description: 'Config Nginx du frontend. Proxifie /api vers Laravel et gère le SPA fallback pour Vue Router.',
            connections: [
              { name: 'Dockerfile (front)', how: 'copié dans /etc/nginx/conf.d/' },
              { name: 'api.php',            how: 'proxy les requêtes /api/* vers Laravel' },
            ],
            guide: [
              { fn: 'location /api/', desc: 'Proxy inverse — toute requête commençant par /api/ est redirigée vers le conteneur "api" (Laravel). Le navigateur ne voit qu\'un seul serveur :8082, mais derrière il y a Laravel ET Nginx.' },
              { fn: 'try_files $uri $uri/ /index.html', desc: 'SPA Fallback — si l\'URL demandée n\'existe pas comme fichier (ex: /employees/42), Nginx sert index.html. Vue Router prend le relais et affiche la bonne vue. Sans ça, un F5 sur /employees donnerait une 404.' },
            ]
          },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════════════
  // BAKHAT Aya — Frontend Lead
  // ════════════════════════════════════════════════════════════
  'BAKHAT Aya': {
    role: 'Frontend Lead — Vue 3 + UI/UX',
    groups: [
      {
        label: 'Layout & Global',
        files: [
          {
            name: 'App.vue',
            path: `${BASE}/hrm-frontend/src/App.vue`,
            layer: 'Root',
            description: 'Composant racine — chef d\'orchestre de l\'application. Contient le layout global (header + sidebar + RouterView) et écoute l\'authentification.',
            connections: [
              { name: 'main.js',        how: 'monté par createApp(App)' },
              { name: 'AppHeader.vue',  how: 'inclus dans le layout' },
              { name: 'AppSidebar.vue', how: 'inclus dans le layout' },
              { name: 'router.js',      how: 'utilise <RouterView> pour la vue active' },
              { name: 'auth.js',        how: 'écoute l\'état d\'auth pour afficher/masquer le layout' },
            ],
            guide: [
              { fn: '<RouterView />', desc: 'Composant Vue Router qui affiche automatiquement le composant correspondant à l\'URL actuelle. Quand l\'URL passe de /employees à /projects, seul ce bloc change — le header et la sidebar restent en place.' },
              { fn: 'watch(isAuthenticated)', desc: 'Surveille l\'état de connexion. Si l\'utilisateur se déconnecte (token révoqué), redirige automatiquement vers /login même sans clic sur un bouton.' },
              { fn: 'provide(\'user\')', desc: 'Injecte les infos de l\'utilisateur connecté dans tout l\'arbre de composants. N\'importe quel composant enfant peut appeler inject(\'user\') pour y accéder sans passer par des props.' },
            ]
          },
          {
            name: 'main.js',
            path: `${BASE}/hrm-frontend/src/main.js`,
            layer: 'Bootstrap',
            description: 'Point d\'entrée unique de Vue 3. Crée l\'app, installe tous les plugins (Pinia, Router, i18n), monte dans index.html.',
            connections: [
              { name: 'App.vue',   how: 'composant racine passé à createApp()' },
              { name: 'router.js', how: 'installé via app.use(router)' },
              { name: 'auth.js',   how: 'Pinia initialisé ici, store disponible partout' },
              { name: 'style.css', how: 'importé ici, disponible dans tous les composants' },
            ],
            guide: [
              { fn: 'createApp(App)', desc: 'Crée l\'instance Vue 3 avec App.vue comme composant racine. Tout part de là.' },
              { fn: '.use(createPinia())', desc: 'Installe Pinia — le gestionnaire d\'état global. Après cette ligne, n\'importe quel composant peut importer et utiliser un store (useAuthStore(), useEmployeeStore()…).' },
              { fn: '.use(router)', desc: 'Installe Vue Router. Active <RouterView>, <RouterLink> et $router dans tous les composants.' },
              { fn: '.mount(\'#app\')', desc: 'Attache l\'application Vue à la div#app dans index.html. C\'est ici que Vue "prend le contrôle" du DOM.' },
            ]
          },
          {
            name: 'style.css',
            path: `${BASE}/hrm-frontend/src/style.css`,
            layer: 'Style',
            description: 'Design System CSS. Variables de couleurs, reset, typographie. Centralise toutes les couleurs pour changer le thème en un seul endroit.',
            connections: [
              { name: 'main.js', how: 'importé une seule fois, disponible partout' },
            ],
            guide: [
              { fn: ':root { --primary: #... }', desc: 'Variables CSS globales — le Design System. En changeant --primary ici, toute l\'interface change de couleur. Les composants utilisent var(--primary) au lieu de coder la couleur en dur.' },
              { fn: '*, *::before, *::after { box-sizing: border-box }', desc: 'Reset CSS — s\'assure que le padding est inclus dans la largeur des éléments (comportement intuitif). Sans ça, un div width:100px + padding:10px ferait 120px.' },
            ]
          },
          {
            name: 'AppHeader.vue',
            path: `${BASE}/hrm-frontend/src/components/layout/AppHeader.vue`,
            layer: 'Layout',
            description: 'Barre de navigation supérieure persistante. Logo, nom de l\'utilisateur connecté, notifications et bouton de déconnexion.',
            connections: [
              { name: 'App.vue',   how: 'inclus dans le layout de App.vue' },
              { name: 'auth.js',   how: 'lit user.name et user.role' },
              { name: 'router.js', how: 'RouterLink pour naviguer' },
            ],
            guide: [
              { fn: 'const auth = useAuthStore()', desc: 'Importe le store d\'authentification Pinia. auth.user.name et auth.user.role sont réactifs — si les données changent en base, l\'affichage se met à jour automatiquement.' },
              { fn: '@click="auth.logout()"', desc: 'Appelle la méthode logout() du store auth qui révoque le token côté API (POST /logout), supprime le token du localStorage, puis redirige vers /login.' },
            ]
          },
          {
            name: 'AppSidebar.vue',
            path: `${BASE}/hrm-frontend/src/components/layout/AppSidebar.vue`,
            layer: 'Layout',
            description: 'Navigation latérale avec tous les liens. Filtre les entrées selon le rôle RBAC — un employé ne voit pas les liens admin.',
            connections: [
              { name: 'App.vue',   how: 'inclus dans le layout de App.vue' },
              { name: 'auth.js',   how: 'lit user.role pour filtrer les liens' },
              { name: 'router.js', how: 'RouterLink pour chaque lien de menu' },
            ],
            guide: [
              { fn: 'v-if="auth.isAdmin"', desc: 'Directive Vue — affiche ou masque un lien selon le rôle. Si l\'utilisateur n\'est pas admin, l\'élément n\'existe pas du tout dans le DOM (pas juste caché).' },
              { fn: 'RouterLink :to="/employees"', desc: 'Composant Vue Router — génère un <a> qui navigue sans recharger la page. La classe "active" est ajoutée automatiquement si l\'URL courante correspond.' },
              { fn: 'HrmBot (chatbot)', desc: 'Le composant HrmBot est inclus en bas de la sidebar pour être accessible depuis n\'importe quelle page de l\'application.' },
            ]
          },
        ]
      },
      {
        label: 'Composants UI',
        files: [
          {
            name: 'BaseButton.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/BaseButton.vue`,
            layer: 'UI Component',
            description: 'Bouton réutilisable avec variantes (primary/danger/ghost), tailles et état loading. Utilisé dans tous les formulaires.',
            connections: [
              { name: 'EmployeeFormView.vue', how: 'boutons Enregistrer / Annuler' },
              { name: 'ProjectFormView.vue',  how: 'boutons Créer / Annuler' },
              { name: 'ReviewFormView.vue',   how: 'bouton Soumettre' },
            ],
            guide: [
              { fn: 'defineProps({ variant, size, loading })', desc: 'Props = paramètres que le parent passe au bouton. <BaseButton variant="danger" loading> affiche un spinner et désactive le bouton automatiquement.' },
              { fn: ':disabled="loading || disabled"', desc: 'Désactive le bouton pendant le chargement pour éviter les doubles soumissions. L\'utilisateur ne peut pas cliquer deux fois.' },
              { fn: '<slot />', desc: 'Slot Vue — l\'emplacement pour le texte ou l\'icône du bouton. <BaseButton>Enregistrer</BaseButton> — "Enregistrer" va dans le slot.' },
            ]
          },
          {
            name: 'BaseInput.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/BaseInput.vue`,
            layer: 'UI Component',
            description: 'Champ de saisie standardisé avec label, validation et support v-model. Gère tous les types (text, email, password, date, number).',
            connections: [
              { name: 'EmployeeFormView.vue', how: 'champs nom, email, poste…' },
              { name: 'ProjectFormView.vue',  how: 'champs titre, dates' },
            ],
            guide: [
              { fn: 'defineModel()', desc: 'Macro Vue 3.4 qui crée automatiquement la liaison v-model bidirectionnelle. Quand l\'utilisateur tape dans le champ, la valeur dans le parent est mise à jour en temps réel.' },
              { fn: 'v-if="error" class="error-msg"', desc: 'Affiche le message d\'erreur de validation sous le champ. Le parent passe la prop :error="\'Email invalide\'" et BaseInput l\'affiche au bon endroit.' },
            ]
          },
          {
            name: 'BaseModal.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/BaseModal.vue`,
            layer: 'UI Component',
            description: 'Dialog/popup avec overlay. Fermeture via Échap ou clic extérieur. Slots pour header, body et footer.',
            connections: [
              { name: 'EmployeeListView.vue', how: 'confirmation de suppression' },
              { name: 'ProjectDetailView.vue',how: 'modal d\'assignation d\'employé' },
            ],
            guide: [
              { fn: 'onMounted → addEventListener(\'keydown\')', desc: 'Écoute la touche Échap pour fermer la modal. onUnmounted retire l\'écouteur pour éviter les fuites mémoire.' },
              { fn: 'Teleport to="body"', desc: 'Vue Teleport — rend la modal directement dans <body> au lieu de là où le composant est déclaré. Évite les problèmes de z-index et overflow:hidden des parents.' },
              { fn: '@click.self="close"', desc: '.self = l\'événement se déclenche uniquement si on clique sur cet élément précis (pas ses enfants). Permet de fermer en cliquant sur l\'overlay mais pas sur le contenu de la modal.' },
            ]
          },
          {
            name: 'BaseTable.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/BaseTable.vue`,
            layer: 'UI Component',
            description: 'Tableau de données générique avec tri, pagination et slots pour personnaliser les cellules.',
            connections: [
              { name: 'EmployeeListView.vue', how: 'tableau principal des employés' },
              { name: 'ProjectListView.vue',  how: 'tableau principal des projets' },
              { name: 'ReviewListView.vue',   how: 'tableau des évaluations' },
            ],
            guide: [
              { fn: 'defineProps({ columns, data, loading })', desc: 'columns = définition des colonnes [{ key: \'name\', label: \'Nom\', sortable: true }]. data = tableau d\'objets. Le composant génère le tableau automatiquement.' },
              { fn: '<slot :name="col.key" :row="row">', desc: 'Scoped slot — le parent peut personnaliser le rendu de n\'importe quelle cellule. Ex: afficher un badge coloré au lieu du texte brut pour la colonne "statut".' },
              { fn: 'sortedData (computed)', desc: 'Vue computed — recalcule automatiquement l\'ordre des données quand sortKey ou sortDir changent. Aucune requête API — le tri se fait entièrement côté client.' },
            ]
          },
          {
            name: 'BaseBadge.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/BaseBadge.vue`,
            layer: 'UI Component',
            description: 'Badge coloré pour les statuts (Actif/Inactif, En cours/Terminé) et niveaux de compétence. Couleur automatique selon la valeur.',
            connections: [
              { name: 'EmployeeListView.vue',   how: 'statut actif/inactif' },
              { name: 'ProjectListView.vue',    how: 'statut du projet' },
              { name: 'EmployeeDetailView.vue', how: 'badges des compétences' },
            ],
            guide: [
              { fn: 'colorMap (computed)', desc: 'Mappe chaque valeur à une couleur CSS. "actif" → vert, "inactif" → rouge, "en cours" → bleu. Le composant parent passe juste la valeur, BaseBadge choisit la couleur.' },
            ]
          },
        ]
      },
      {
        label: 'Vues — Employés',
        files: [
          {
            name: 'EmployeeListView.vue',
            path: `${BASE}/hrm-frontend/src/views/employees/EmployeeListView.vue`,
            layer: 'Vue',
            description: 'Page principale de gestion des employés. Tableau avec recherche, filtres, tri et suppression avec confirmation.',
            connections: [
              { name: 'employee.js',           how: 'charge et supprime les employés' },
              { name: 'BaseTable.vue',          how: 'composant tableau principal' },
              { name: 'BaseModal.vue',          how: 'confirmation avant suppression' },
              { name: 'BaseBadge.vue',          how: 'statut actif/inactif' },
              { name: 'router.js',              how: 'navigue vers Detail et Form' },
              { name: 'EmployeeController.php', how: 'données depuis GET /employees' },
            ],
            guide: [
              { fn: 'onMounted(() => employeeStore.fetchEmployees())', desc: 'Charge la liste des employés depuis l\'API au moment où la vue est affichée. onMounted = cycle de vie Vue, exécuté après que le DOM est rendu.' },
              { fn: 'filteredEmployees (computed)', desc: 'Filtre réactif — recalcule automatiquement la liste quand l\'utilisateur tape dans la barre de recherche. Pas de requête API à chaque frappe — le filtre est en mémoire.' },
              { fn: 'deleteEmployee(id)', desc: 'Ouvre BaseModal pour confirmation, attend la réponse de l\'utilisateur, puis appelle employeeStore.deleteEmployee(id) qui envoie DELETE /employees/:id à l\'API.' },
            ]
          },
          {
            name: 'EmployeeDetailView.vue',
            path: `${BASE}/hrm-frontend/src/views/employees/EmployeeDetailView.vue`,
            layer: 'Vue',
            description: 'Fiche complète d\'un employé. Photo, infos, compétences avec niveaux, projets actifs, historique évaluations.',
            connections: [
              { name: 'employee.js', how: 'charge les détails + compétences' },
              { name: 'project.js',  how: 'charge les projets de l\'employé' },
              { name: 'router.js',   how: 'reçoit l\'ID via $route.params.id' },
            ],
            guide: [
              { fn: 'const route = useRoute()', desc: 'useRoute() donne accès aux paramètres de l\'URL. route.params.id contient l\'ID de l\'employé (ex: /employees/42 → id = 42).' },
              { fn: 'watch(() => route.params.id)', desc: 'Si l\'utilisateur navigue directement vers un autre employé, recharge les données sans démonter/remonter la vue.' },
            ]
          },
          {
            name: 'EmployeeFormView.vue',
            path: `${BASE}/hrm-frontend/src/views/employees/EmployeeFormView.vue`,
            layer: 'Vue',
            description: 'Formulaire ajout/édition d\'employé. Détecte le mode (create vs edit) via l\'URL. Gère l\'upload de photo avec prévisualisation.',
            connections: [
              { name: 'employee.js',   how: 'createEmployee() ou updateEmployee()' },
              { name: 'BaseInput.vue', how: 'champs du formulaire' },
              { name: 'BaseButton.vue',how: 'boutons Enregistrer et Annuler' },
              { name: 'router.js',     how: 'redirige après succès' },
            ],
            guide: [
              { fn: 'const isEdit = computed(() => !!route.params.id)', desc: 'Détecte si on est en mode édition (URL contient un ID) ou création (pas d\'ID). Le même formulaire sert pour les deux cas.' },
              { fn: 'photoPreview (ref)', desc: 'URL temporaire de prévisualisation de la photo. URL.createObjectURL(file) génère une URL locale pour afficher l\'image avant de l\'envoyer au serveur.' },
              { fn: 'FormData pour l\'upload', desc: 'Pour envoyer un fichier (photo), on utilise FormData au lieu de JSON. FormData permet de mélanger texte et fichiers binaires dans une seule requête HTTP multipart/form-data.' },
            ]
          },
        ]
      },
      {
        label: 'Vues — Projets & Évaluations',
        files: [
          {
            name: 'ProjectListView.vue',
            path: `${BASE}/hrm-frontend/src/views/projects/ProjectListView.vue`,
            layer: 'Vue',
            description: 'Liste de tous les projets avec filtres (statut) et indicateurs (membres, avancement).',
            connections: [
              { name: 'project.js',   how: 'charge les projets' },
              { name: 'BaseTable.vue',how: 'tableau des projets' },
              { name: 'BaseBadge.vue',how: 'badge statut' },
            ],
            guide: [
              { fn: 'onMounted → projectStore.fetchProjects()', desc: 'Charge tous les projets au montage. Le store met en cache — si on revient sur cette page, les données sont déjà en mémoire et s\'affichent instantanément.' },
            ]
          },
          {
            name: 'ProjectDetailView.vue',
            path: `${BASE}/hrm-frontend/src/views/projects/ProjectDetailView.vue`,
            layer: 'Vue',
            description: 'Détail d\'un projet : membres, timeline, workloads. Modal pour ajouter/retirer des membres.',
            connections: [
              { name: 'project.js',   how: 'charge le projet et ses membres' },
              { name: 'employee.js',  how: 'liste les employés disponibles' },
              { name: 'BaseModal.vue',how: 'modal d\'assignation' },
            ],
            guide: [
              { fn: 'addMember(employee)', desc: 'Appelle projectStore.addMember(projectId, employeeId) → POST /projects/:id/members. Le store met à jour le cache local immédiatement (optimistic update) puis confirme avec l\'API.' },
            ]
          },
          {
            name: 'ProjectFormView.vue',
            path: `${BASE}/hrm-frontend/src/views/projects/ProjectFormView.vue`,
            layer: 'Vue',
            description: 'Formulaire création/édition de projet avec sélection multiple des membres.',
            connections: [
              { name: 'project.js',    how: 'createProject() ou updateProject()' },
              { name: 'employee.js',   how: 'liste pour le sélecteur de membres' },
              { name: 'BaseInput.vue', how: 'champs du formulaire' },
            ],
            guide: [
              { fn: 'selectedMembers (ref)', desc: 'Tableau des IDs d\'employés sélectionnés. Envoyé avec le projet à la création pour créer les lignes dans la table pivot employee_project en une seule requête.' },
            ]
          },
          {
            name: 'ReviewFormView.vue',
            path: `${BASE}/hrm-frontend/src/views/reviews/ReviewFormView.vue`,
            layer: 'Vue',
            description: 'Formulaire d\'évaluation de performance. Notes 1-5 étoiles par critère et commentaire. Réservé aux managers.',
            connections: [
              { name: 'employee.js',   how: 'liste les employés à évaluer' },
              { name: 'auth.js',       how: 'vérifie le rôle manager/admin' },
              { name: 'BaseInput.vue', how: 'champ commentaire' },
            ],
            guide: [
              { fn: 'StarRating component', desc: 'Composant de notation en étoiles (1-5). Chaque clic met à jour rating.value. La valeur est envoyée dans le POST /reviews avec les autres champs.' },
              { fn: 'guard: auth.isManager', desc: 'Si l\'utilisateur n\'est pas manager ou admin, redirigé vers le dashboard. La vérification est aussi faite côté API (double protection).' },
            ]
          },
          {
            name: 'ReviewListView.vue',
            path: `${BASE}/hrm-frontend/src/views/reviews/ReviewListView.vue`,
            layer: 'Vue',
            description: 'Historique des évaluations. Filtre selon le rôle : admin voit tout, employé voit les siennes.',
            connections: [
              { name: 'employee.js', how: 'données des employés évalués' },
              { name: 'auth.js',     how: 'détermine ce qu\'on affiche selon le rôle' },
              { name: 'BaseTable.vue',how: 'tableau des évaluations' },
            ],
            guide: [
              { fn: 'filteredReviews (computed)', desc: 'Si auth.isAdmin → toutes les reviews. Sinon → uniquement celles où employee_id == auth.user.employeeId. Le filtre est côté client, mais l\'API fait aussi sa propre vérification.' },
            ]
          },
        ]
      },
      {
        label: 'Vues — Autres',
        files: [
          {
            name: 'DashboardView.vue',
            path: `${BASE}/hrm-frontend/src/views/DashboardView.vue`,
            layer: 'Vue',
            description: 'Page d\'accueil. KPIs (employés actifs, projets en cours), activité récente. Contenu adapté au rôle.',
            connections: [
              { name: 'employee.js', how: 'stats employés' },
              { name: 'project.js',  how: 'projets récents' },
              { name: 'auth.js',     how: 'personnalise selon le rôle' },
            ],
            guide: [
              { fn: 'Promise.all([fetchEmployees(), fetchProjects()])', desc: 'Lance les deux requêtes API en parallèle au lieu de séquentiellement. Le tableau s\'affiche 2× plus vite qu\'avec deux await consécutifs.' },
              { fn: 'KPIs (computed)', desc: 'Calcule les indicateurs à partir des données déjà chargées dans les stores. Pas de requête API dédiée — on réutilise ce qu\'on a déjà en mémoire.' },
            ]
          },
          {
            name: 'LoginView.vue',
            path: `${BASE}/hrm-frontend/src/views/auth/LoginView.vue`,
            layer: 'Vue',
            description: 'Page de connexion. Envoie credentials au store auth qui appelle POST /login. Redirige vers dashboard si succès.',
            connections: [
              { name: 'auth.js',           how: 'appelle auth.login()' },
              { name: 'AuthController.php', how: 'reçoit les credentials' },
              { name: 'router.js',          how: 'redirige vers /dashboard' },
            ],
            guide: [
              { fn: 'await auth.login(email, password)', desc: 'Le store auth envoie POST /login, reçoit le token Sanctum, le stocke dans localStorage. En cas d\'erreur 422 (credentials invalides), affiche le message d\'erreur sous le formulaire.' },
              { fn: 'router.push(\'/dashboard\')', desc: 'Navigation programmatique après succès. Vue Router change l\'URL et affiche DashboardView sans rechargement de page.' },
            ]
          },
          {
            name: 'ProfileView.vue',
            path: `${BASE}/hrm-frontend/src/views/ProfileView.vue`,
            layer: 'Vue',
            description: 'Profil de l\'utilisateur connecté. Modification des infos personnelles, mot de passe et photo.',
            connections: [
              { name: 'auth.js',     how: 'infos de l\'utilisateur connecté' },
              { name: 'employee.js', how: 'met à jour le profil employé lié' },
            ],
            guide: [
              { fn: 'changePassword()', desc: 'Envoie l\'ancien ET le nouveau mot de passe. Le backend vérifie l\'ancien (Hash::check), hache le nouveau (Hash::make), et sauvegarde. Jamais de mot de passe en clair en base.' },
            ]
          },
        ]
      },
      {
        label: 'Config Vite',
        files: [
          {
            name: 'vite.config.js',
            path: `${BASE}/hrm-frontend/vite.config.js`,
            layer: 'Config',
            description: 'Build tool Vite — compile les .vue, gère le HMR en dev et proxifie les requêtes /api vers Laravel pour éviter les erreurs CORS.',
            connections: [
              { name: 'main.js',   how: 'Vite est le bundler de tout le code src/' },
              { name: 'nginx.conf',how: 'en prod, Nginx remplace le proxy Vite' },
              { name: 'api.php',   how: 'requêtes /api proxifiées vers Laravel' },
            ],
            guide: [
              { fn: 'plugins: [vue()]', desc: 'Active le compilateur Vue — transforme les fichiers .vue (Single File Components) en JavaScript standard que le navigateur comprend.' },
              { fn: 'proxy: { \'/api\': \'http://localhost:8000\' }', desc: 'En développement, redirige fetch(\'/api/employees\') vers http://localhost:8000/api/employees (Laravel). Sans ça, le navigateur bloquerait la requête pour cause de CORS (origines différentes).' },
              { fn: 'host: true', desc: 'Expose le serveur de dev sur toutes les interfaces réseau (pas que localhost). Permet d\'accéder depuis un autre appareil sur le même WiFi pour tester sur mobile.' },
            ]
          },
          {
            name: 'package.json',
            path: `${BASE}/hrm-frontend/package.json`,
            layer: 'Config',
            description: 'Manifeste npm. Déclare les dépendances (Vue 3, Pinia, Router, Axios, i18n) et les scripts (dev, build, preview).',
            connections: [
              { name: 'vite.config.js', how: 'Vite est déclaré ici comme devDependency' },
              { name: 'main.js',        how: 'toutes les dépendances sont importées dans le code' },
            ],
            guide: [
              { fn: '"dependencies" vs "devDependencies"', desc: 'dependencies = inclus dans le build final (Vue, Pinia, Axios). devDependencies = outils de développement seulement, pas dans la prod (Vite, TypeScript). Réduit la taille du bundle.' },
              { fn: '"scripts": { "dev", "build", "preview" }', desc: 'npm run dev → serveur Vite avec HMR. npm run build → compile et optimise dans dist/. npm run preview → sert dist/ localement pour tester le build prod.' },
            ]
          },
        ]
      }
    ]
  },

  // ════════════════════════════════════════════════════════════
  // AKDI Issam — Intégration API + Stores + Chatbot IA
  // ════════════════════════════════════════════════════════════
  'AKDI Issam': {
    role: 'Intégration API + Stores + Chatbot IA',
    groups: [
      {
        label: 'Intégration API',
        files: [
          {
            name: 'http.js',
            path: `${BASE}/hrm-frontend/src/api/http.js`,
            layer: 'API Client',
            description: 'Instance Axios centralisée. Injecte automatiquement le token Sanctum dans chaque requête. Gère les erreurs 401 (token expiré → logout automatique).',
            connections: [
              { name: 'auth.js',     how: 'interceptor lit le token du store' },
              { name: 'employee.js', how: 'utilisé pour tous les appels /employees' },
              { name: 'project.js',  how: 'utilisé pour tous les appels /projects' },
              { name: 'api.php',     how: 'toutes les requêtes atteignent ces routes' },
            ],
            guide: [
              { fn: 'axios.create({ baseURL })', desc: 'Crée une instance Axios configurée avec la bonne URL de base. Tous les stores importent CETTE instance — pas axios directement. Changer la baseURL ici suffit à tout mettre à jour.' },
              { fn: 'interceptors.request.use()', desc: 'Intercepteur de requête — s\'exécute avant CHAQUE appel API. Lit le token depuis le store auth et l\'ajoute dans le header "Authorization: Bearer <token>". Sans ça, chaque store devrait gérer le token lui-même.' },
              { fn: 'interceptors.response.use(null, error)', desc: 'Intercepteur de réponse — capte les erreurs. Si le serveur retourne 401 (token invalide), appelle automatiquement auth.logout() et redirige vers /login sans que le store n\'ait à le gérer.' },
            ]
          },
          {
            name: 'router.js',
            path: `${BASE}/hrm-frontend/src/router/index.js`,
            layer: 'Router',
            description: 'Routeur Vue — définit toutes les URLs de l\'application SPA. Navigation guards : vérifie l\'authentification avant chaque navigation.',
            connections: [
              { name: 'auth.js',              how: 'guard lit isAuthenticated' },
              { name: 'main.js',              how: 'installé via app.use(router)' },
              { name: 'DashboardView.vue',    how: 'route /' },
              { name: 'EmployeeListView.vue', how: 'route /employees' },
              { name: 'LoginView.vue',        how: 'route /login (seule route publique)' },
            ],
            guide: [
              { fn: 'createRouter({ history: createWebHistory() })', desc: 'Crée le routeur avec l\'historique HTML5 (URLs propres /employees au lieu de /#/employees). Nécessite le SPA fallback côté serveur (nginx.conf ou vite proxy).' },
              { fn: 'routes: [{ path, component, meta }]', desc: 'Chaque route mappe une URL vers un composant Vue. meta: { requiresAuth: true } marque une route comme protégée. Vue Router ne le fait pas tout seul — on doit lire ce meta dans le guard.' },
              { fn: 'router.beforeEach((to, from, next))', desc: 'Guard global — exécuté avant CHAQUE navigation. Si to.meta.requiresAuth et !auth.isAuthenticated → next(\'/login\'). Sinon → next() pour continuer. C\'est le "garde du corps" de l\'application.' },
              { fn: 'component: () => import(\'...\')', desc: 'Lazy loading — le composant n\'est téléchargé que quand l\'utilisateur navigue vers cette route. Réduit le bundle initial et accélère le premier chargement.' },
            ]
          },
        ]
      },
      {
        label: 'Stores Pinia',
        files: [
          {
            name: 'auth.js',
            path: `${BASE}/hrm-frontend/src/stores/auth.js`,
            layer: 'Store',
            description: 'Store Pinia d\'authentification. Maintient le token Sanctum, les infos utilisateur et isAuthenticated. Persiste dans localStorage.',
            connections: [
              { name: 'http.js',            how: 'POST /login et GET /user' },
              { name: 'AuthController.php', how: 'backend qui authentifie' },
              { name: 'router.js',          how: 'consulté par les navigation guards' },
              { name: 'AppHeader.vue',      how: 'lit user.name et user.role' },
              { name: 'AppSidebar.vue',     how: 'lit user.role pour filtrer les liens' },
            ],
            guide: [
              { fn: 'defineStore(\'auth\', () => { ... })', desc: 'Définit un store Pinia en Composition API. "auth" est l\'ID unique du store. Tout ce qui est retourné (return { user, token, login, logout }) est accessible depuis n\'importe quel composant.' },
              { fn: 'token = ref(localStorage.getItem(\'token\'))', desc: 'Initialise le token depuis localStorage au démarrage. Si l\'utilisateur avait déjà un token (session précédente), il est automatiquement reconnecté sans re-login.' },
              { fn: 'async login(email, password)', desc: 'Appelle POST /login via http.js, reçoit { token, user }, stocke le token dans localStorage et dans la ref réactive. http.js intercepte ensuite toutes les requêtes et ajoute ce token.' },
              { fn: 'isAuthenticated (computed)', desc: 'Dérivé de token — true si token.value n\'est pas null. Utilisé dans router.js pour protéger les routes et dans AppSidebar pour afficher/masquer des éléments.' },
            ]
          },
          {
            name: 'employee.js',
            path: `${BASE}/hrm-frontend/src/stores/employee.js`,
            layer: 'Store',
            description: 'Store Pinia des employés. Cache local des données. Actions CRUD qui appellent EmployeeController via http.js.',
            connections: [
              { name: 'http.js',               how: 'requêtes HTTP via Axios' },
              { name: 'EmployeeController.php', how: 'toutes les requêtes arrivent ici' },
              { name: 'EmployeeListView.vue',   how: 'appelle fetchEmployees()' },
              { name: 'EmployeeDetailView.vue', how: 'appelle fetchEmployee(id)' },
            ],
            guide: [
              { fn: 'employees = ref([])', desc: 'Cache local en mémoire. Une fois fetchEmployees() appelé, la liste est en mémoire. Les vues qui utilisent ce store accèdent aux données instantanément sans nouvelle requête API.' },
              { fn: 'async fetchEmployees()', desc: 'GET /employees → remplace employees.value avec les données fraîches. Le loading flag est géré ici — les vues n\'ont pas à gérer l\'état de chargement elles-mêmes.' },
              { fn: 'async deleteEmployee(id)', desc: 'DELETE /employees/:id → si succès, retire l\'employé du cache local (employees.value.filter(...)). La liste se met à jour immédiatement sans re-fetcher toute la liste.' },
              { fn: 'getById(id) (computed/getter)', desc: 'Cherche un employé dans le cache par ID. Si EmployeeDetailView et EmployeeListView utilisent le même store, les données ne sont chargées qu\'une fois.' },
            ]
          },
          {
            name: 'project.js',
            path: `${BASE}/hrm-frontend/src/stores/project.js`,
            layer: 'Store',
            description: 'Store Pinia des projets. Même architecture que employee.js — cache local, actions CRUD, gestion des membres.',
            connections: [
              { name: 'http.js',              how: 'requêtes HTTP via Axios' },
              { name: 'ProjectController.php', how: 'toutes les requêtes arrivent ici' },
              { name: 'ProjectListView.vue',   how: 'appelle fetchProjects()' },
              { name: 'ProjectDetailView.vue', how: 'appelle fetchProject(id) et addMember()' },
            ],
            guide: [
              { fn: 'async addMember(projectId, employeeId)', desc: 'POST /projects/:id/members → ajoute l\'employé dans la table pivot. Met à jour le cache local immédiatement (optimistic update) pour que l\'UI réponde sans attendre la confirmation API.' },
              { fn: 'async removeMember(projectId, employeeId)', desc: 'DELETE /projects/:id/members/:employeeId → retire de la table pivot. Même logique de mise à jour du cache local.' },
            ]
          },
        ]
      },
      {
        label: 'Chatbot IA',
        files: [
          {
            name: 'ChatController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/ChatController.php`,
            layer: 'Controller',
            description: 'Pipeline IA multi-tiers (1924 lignes). 6 niveaux de traitement avant de tomber sur Ollama. Boucle d\'apprentissage autonome via ChatCorrect.',
            connections: [
              { name: 'Employee.php',       how: '12 outils Ollama interrogent ce modèle' },
              { name: 'Project.php',        how: 'workloads, candidats, projets actifs' },
              { name: 'Department.php',     how: 'stats par département' },
              { name: 'console.php',        how: 'ChatCorrect déclenché par le Scheduler' },
              { name: 'chat_migration.php', how: 'utilise chat_messages, feedback, learned' },
              { name: 'api.php',            how: 'exposé sur POST /chat (SSE)' },
              { name: 'HrmBot.vue',         how: 'consomme le flux SSE token par token' },
            ],
            guide: [
              { fn: 'chat(Request $request) — Point d\'entrée', desc: 'Reçoit le message et l\'historique. Lance le pipeline en cascade : Tier 0 → Pré-T1 → Tier 1 → Tier 2 → Tier 2b → Tier 3. Si un tier répond, les suivants ne sont pas exécutés.' },
              { fn: 'Tier 0 — resolveActionIntent()', desc: 'Détecte les intentions d\'action (ajouter, créer, nouveau). Si l\'utilisateur dit "ajouter un employé", retourne un lien vers le formulaire au lieu d\'aller dans Ollama. Réponse en < 1ms.' },
              { fn: 'Tier 1 — checkFaq()', desc: '17 questions prédéfinies avec distance de Levenshtein. Si la question ressemble à une FAQ à 35% près (fautes de frappe tolérées), retourne la réponse directement. Zéro appel Ollama.' },
              { fn: 'Tier 2 — resolveDataIntent()', desc: '15 intentions de données détectées par mots-clés (count, list, search…). Requête directe en base avec Cache Laravel (120-300s). Réponse en ~10ms vs ~5s pour Ollama.' },
              { fn: 'Tier 3 — streamOllama()', desc: 'Dernier recours. needsDataAccess() décide : si la question nécessite des données → qwen2.5:7b + 12 outils DB. Sinon → qwen2.5:0.5b pour les questions générales. Streaming SSE token par token.' },
              { fn: 'needsDataAccess()', desc: 'Analyse le message pour des signaux de données (noms propres, chiffres, mots-clés RH). Si oui → modèle lourd 7b avec tool calling. Si non → modèle léger 0.5b 10× plus rapide.' },
              { fn: 'ChatCorrect() — Boucle d\'apprentissage', desc: 'Appelé toutes les minutes par le Scheduler. Lit les feedbacks 👎, envoie la question+mauvaise réponse à qwen2.5:7b en demandant une meilleure version. Sauvegarde dans chat_learned. Le tier 3 injecte ces corrections dans son contexte.' },
            ]
          },
          {
            name: 'HrmBot.vue',
            path: `${BASE}/hrm-frontend/src/components/ui/HrmBot.vue`,
            layer: 'Vue Component',
            description: 'Widget chat flottant. Streaming SSE token par token, markdown rendu, historique localStorage, feedback 👍/👎.',
            connections: [
              { name: 'ChatController.php', how: 'POST /chat → flux SSE text/event-stream' },
              { name: 'auth.js',            how: 'token Bearer pour authentifier la requête' },
              { name: 'AppSidebar.vue',     how: 'inclus en bas de la sidebar' },
            ],
            guide: [
              { fn: 'EventSource / fetch SSE', desc: 'Le chatbot utilise fetch() avec un ReadableStream pour lire le flux SSE. Chaque chunk reçu est ajouté au message en cours. L\'utilisateur voit les mots apparaître un par un (comme ChatGPT).' },
              { fn: 'marked(DOMPurify.sanitize(text))', desc: 'Rendu markdown sécurisé. marked() convertit le markdown en HTML. DOMPurify nettoie le HTML avant injection dans le DOM pour éviter les attaques XSS (injection de code malveillant).' },
              { fn: 'localStorage pour l\'historique', desc: 'Les messages sont sauvegardés dans localStorage. À la réouverture du chat, l\'historique est restauré. Limite à N messages pour éviter de saturer le stockage.' },
              { fn: 'sendFeedback(messageId, rating)', desc: 'POST /chat/feedback avec 👍 ou 👎. Le backend stocke dans chat_feedback. ChatCorrect lit ces feedbacks pour améliorer les réponses futures.' },
            ]
          },
          {
            name: 'chat_migration.php',
            path: `${BASE}/hrm-laravel/database/migrations/2026_06_24_000001_create_chat_tables.php`,
            layer: 'Migration',
            description: 'Crée les 3 tables du chatbot : chat_messages (historique), chat_feedback (👍/👎), chat_learned (corrections IA).',
            connections: [
              { name: 'ChatController.php', how: 'lit et écrit dans ces 3 tables' },
              { name: 'console.php',        how: 'ChatCorrect lit feedback et écrit learned' },
            ],
            guide: [
              { fn: 'Schema::create(\'chat_messages\')', desc: 'Table historique : id, user_id, role (user/assistant), content (texte), tier_used (0-3 — quel niveau a répondu), created_at. Le tier_used permet d\'analyser les performances de chaque niveau.' },
              { fn: 'Schema::create(\'chat_feedback\')', desc: 'Table feedback : message_id (FK vers chat_messages), rating (thumbs_up/thumbs_down), created_at. ChatCorrect parcourt uniquement les thumbs_down pour les corriger.' },
              { fn: 'Schema::create(\'chat_learned\')', desc: 'Table corrections : question (originale), bad_answer (celle qui a reçu 👎), good_answer (générée par qwen2.5:7b), confidence (score 0-1), used_count. getRelevantLearned() injecte les meilleures corrections dans le contexte Tier 3.' },
              { fn: 'up() / down()', desc: 'up() crée les tables (php artisan migrate). down() les supprime (php artisan migrate:rollback). Toujours écrire down() pour pouvoir annuler proprement.' },
            ]
          },
        ]
      },
      {
        label: 'Module Analyse',
        files: [
          {
            name: 'AnalysisController.php',
            path: `${BASE}/hrm-laravel/app/Http/Controllers/AnalysisController.php`,
            layer: 'Controller',
            description: 'Analyses RH avancées : skill gap, matching employé/projet, prédictions. Peut déléguer à Ollama pour des analyses complexes.',
            connections: [
              { name: 'Employee.php', how: 'analyse compétences et historiques' },
              { name: 'Skill.php',    how: 'calcule le skill gap par département' },
              { name: 'Project.php',  how: 'matching employés/projet' },
              { name: 'api.php',      how: 'exposé sur GET /analysis/*' },
            ],
            guide: [
              { fn: 'skillGap(Department $dept)', desc: 'Compare les compétences requises dans le département (définies par les managers) vs les compétences disponibles des employés actuels. Retourne la liste des compétences manquantes et le nombre d\'employés à former.' },
              { fn: 'matchCandidates(Project $project)', desc: 'Algorithme de scoring — pour chaque employé disponible, calcule un score de correspondance avec les besoins du projet (compétences requises × niveau de maîtrise). Retourne le top 5 des candidats.' },
            ]
          },
          {
            name: 'SecurityView.vue',
            path: `${BASE}/hrm-frontend/src/views/SecurityView.vue`,
            layer: 'Vue',
            description: 'Dashboard de sécurité et d\'audit. Connexions récentes, tokens actifs, actions sensibles. Admins uniquement.',
            connections: [
              { name: 'auth.js',  how: 'vérifie le rôle admin' },
              { name: 'http.js',  how: 'requêtes vers /api/audit' },
              { name: 'router.js',how: 'route /security protégée' },
            ],
            guide: [
              { fn: 'onMounted — guard admin', desc: 'Vérifie en plus du guard router que l\'utilisateur est bien admin. Double vérification : router.js redirige avant l\'affichage, ce guard protège si quelqu\'un contourne le router.' },
              { fn: 'revokeToken(tokenId)', desc: 'Permet à un admin de révoquer un token actif d\'un utilisateur (ex: si un compte est compromis). DELETE /tokens/:id → le token est supprimé de personal_access_tokens.' },
            ]
          },
        ]
      }
    ]
  }
}

const ALL_ALLOWED = new Set(
  Object.values(USERS).flatMap(u => u.groups.flatMap(g => g.files.map(f => f.path.replace(/\//g, '\\'))))
)

export { ALL_ALLOWED }
