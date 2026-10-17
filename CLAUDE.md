# CLAUDE.md : Acad Ventisax

> Les instructions du projet sont dans **AGENTS.md**, qui est la source de vérité. En cas de divergence, AGENTS.md prime.
> Ce fichier en reprend le contenu pour Claude Code.

## Commandes utiles (à compléter quand le code existera)
- `python manage.py test`
- `python manage.py import_content`
- `./deploy.sh` (sur PythonAnywhere)


Plateforme Django + SQLite hébergée sur https://acadventisax.pythonanywhere.com/fr/ (compte PythonAnywhere `acadventisax`, plan gratuit).
Le site vitrine https://ventisax.pythonanywhere.com/fr/ y renvoie par un simple lien.
Le contenu source est dans `reference/` : photos du support de cours « Froid et climatisation » du centre LA VOCATION (Partie 1, 6 modules) et planning.

## Sécurité (règle absolue)
- Aucun identifiant, mot de passe, token ou SECRET_KEY dans le dépôt, AGENTS.md ou CLAUDE.md compris. Secrets dans `.env` (ignoré par git) ; `.env.example` sans valeurs.
- Aucun texte, question, logo ni asset de NetAcad/Cisco dans le dépôt : seuls les *principes d'interface* sont repris.

## Questions du grill (réponses stabilisées)
| # | Question | Réponse retenue |
|---|---|---|
| Q1 | Quelle fonctionnalité de NetAcad reproduire ? | Parcours complet : lecteur de cours par modules et sections, barre de progression, quiz de fin de module, examen final de partie |
| Q2 | Que représentent les « 500 Mo » ? | Disque de 512 Mo du plan gratuit PythonAnywhere ; cible < 150 Mo au total |
| Q3 | Qui utilise l'app, comment les comptes sont-ils créés ? | Rôles apprenant / formateur / admin ; l'admin crée les comptes (import CSV possible) ; pas d'inscription publique |
| Q3b | Quel formateur voit quels résultats ? | Cloisonnement par promotion : apprenant ∈ 1 promotion ; formateur ↔ plusieurs promotions ; seuls les formateurs publient les questions |
| Q4 | Lien avec ventisax ? | Simple lien ; apps et comptes indépendants |
| Q5 | Hiérarchie du contenu ? Planning dans l'app ? | Formation → Partie → Module → Section ; quiz par module, examen par partie ; planning hors app |
| Q6 | Qui transcrit les photos et écrit les questions ? | Claude transcrit en Markdown versionné et rédige des brouillons de questions ; un formateur valide avant publication |
| Q7 | Types de questions en v1 ? | QCM une réponse, QCM plusieurs réponses, Vrai/Faux (+ image facultative) ; appariement et questions sur image en v2 |
| Q8 | Règles d'évaluation ? | Quiz : illimité, sans chrono, correction + explication, non noté. Examen : 70 %, 3 tentatives, 60 min, mélange, meilleure note retenue, score partiel sur les QCM à plusieurs réponses, seul le score par module est affiché |
| Q8b | Source des questions d'examen ? Coupure réseau ? | Banque séparée (usage = examen), N questions tirées par module ; chrono serveur, sauvegarde au clic, reprise, envoi automatique à expiration |
| Q9 | Progression et suivi ? | Navigation libre ; module terminé = sections vues + quiz tenté ; examen ouvert quand tous les modules sont terminés ; tableau formateur en lecture seule + export CSV |
| Q10 | Évaluation pratique (TAF) ? | Affichée (consignes + annexes), non notée ; évaluée en atelier |
| Q11 | Langues ? | Tout bilingue fr/en : interface et contenu |
| Q11b | Traduction manquante ? Changement de langue pendant l'examen ? | Un objet par question avec champs fr/en ; repli sur le fr avec badge « FR » ; même tentative ; publication seulement si les deux langues sont relues |
| Q12 | Direction de l'interface ? | Patterns NetAcad + charte Ventisax ; mobile d'abord ; < 200 Ko par page ; CSS écrit à la main |
| Q13 | Stack ? | Django 5.2 LTS, gabarits serveur + HTMX vendoré ; deps : django, django-modeltranslation, markdown, bleach |
| Q14 | Déploiement et exploitation ? | GitHub → `deploy.sh` sur PythonAnywhere ; sauvegarde SQLite quotidienne (7 copies) ; DEBUG=False, HTTPS |
| Q15 | Contenu de la v1 ? | Partie 1 complète (6 modules) |
| Q16 | Comment observer NetAcad ? | L'utilisateur se connecte lui-même dans le Chrome CDP (`/cloner-webapp`) ; 4 écrans observés ; principes d'interface seulement |

## GOALS

### 1. Objectifs fonctionnels prioritaires
1. **Lecteur de cours** : Formation → Partie → Module → Section, avec un sommaire repliable et une barre de progression par module et par partie.
2. **Quiz de module** : entraînement illimité, correction et explication affichées après envoi.
3. **Examen de partie** : banque séparée, 70 % pour réussir, 3 tentatives, 60 min chronométrées côté serveur, reprise après coupure, envoi automatique.
4. **Progression** : navigation libre ; l'examen se débloque quand tous les modules de la partie sont terminés.
5. **Comptes et promotions** : créés par l'admin (import CSV) ; trois rôles ; cloisonnement par promotion.
6. **Tableau formateur** : apprenants × modules (progression, meilleur score d'examen) et export CSV.
7. **Workflow éditorial** : questions brouillon → publiées par un formateur, seulement quand fr et en sont relus.
8. **Contenu v1** : Partie 1 (6 modules) transcrite et bilingue, avec ≈ 12 questions de quiz et ≈ 10 questions d'examen par module.
9. **Interface** : bilingue /fr/ et /en/, mobile d'abord, patterns NetAcad, charte Ventisax.

### 2. Contraintes techniques
- Python le plus récent proposé par PythonAnywhere ; **Django 5.2 LTS** ; **SQLite** (un seul fichier, sauvegardé chaque jour).
- Rendu serveur (gabarits Django) + **HTMX vendoré** ; aucun CDN, aucun Node, aucune SPA.
- Dépendances autorisées : `django`, `django-modeltranslation`, `markdown`, `bleach`. Toute autre dépendance demande un accord explicite.
- **Disque < 150 Mo** (code + venv + base + médias) sur un quota de 512 Mo ; images en WebP ; **pages < 200 Ko** à la première visite.
- i18n : `i18n_patterns`, préfixes /fr/ (par défaut) et /en/, gettext pour l'interface, modeltranslation pour le contenu, repli sur le fr.
- Plan gratuit PythonAnywhere : une web app, internet sortant sur liste blanche, pas de tâche permanente (une tâche planifiée par jour).
- Sécurité : DEBUG=False en production, HTTPS forcé, CSRF actif, HTML Markdown nettoyé par bleach, secrets dans `.env`.
- Déploiement : `deploy.sh` (pull, install, migrate, compilemessages, collectstatic, reload).

### 3. Périmètre strictement hors scope (v1)
- Inscription publique, mot de passe oublié par e-mail, SSO ou base partagée avec ventisax, toute modification du dépôt ventisax.
- Planning et calendrier des séances, gestion des formateurs par séance.
- Attestations ou certificats PDF, badges.
- Évaluation pratique notée, grilles d'observation, dépôt de fichiers par les apprenants.
- Questions d'appariement, glisser-déposer, zone cliquable sur image, réponse libre.
- Parcours séquentiel bloquant.
- Mode hors ligne / PWA, application mobile native.
- Parties 2 et suivantes de la formation.
- Toute reprise de textes, questions, logos ou assets de NetAcad/Cisco.
- Paiement, messagerie, forum, notifications.

## PRD

### Personas
- **Apprenant** : stagiaire du centre, sur smartphone Android d'entrée de gamme, données mobiles limitées, connexion instable.
- **Formateur** : intervenant du centre ; suit ses promotions, relit et publie les questions.
- **Admin** : responsable de la plateforme ; gère les comptes, les promotions et le contenu.

### User Stories
**Apprenant**
- US-01 : En tant qu'apprenant, je me connecte avec l'identifiant et le mot de passe fournis par l'admin pour accéder à mes cours.
- US-02 : En tant qu'apprenant, je vois sur mon tableau de bord la formation de ma promotion, ses parties et ma progression en %.
- US-03 : En tant qu'apprenant, je navigue librement entre modules et sections grâce à un sommaire repliable, et je vois quelles sections j'ai déjà vues.
- US-04 : En tant qu'apprenant, je lis une section (texte, images) confortablement sur mobile, et la section est marquée vue.
- US-05 : En tant qu'apprenant, je consulte les activités pratiques (TAF) d'un module et je télécharge ses annexes.
- US-06 : En tant qu'apprenant, je passe le quiz d'un module autant de fois que je veux, et je vois après envoi la correction et l'explication de chaque question.
- US-07 : En tant qu'apprenant, je peux lancer l'examen de partie quand tous ses modules sont terminés ; sinon je vois ce qui manque.
- US-08 : En tant qu'apprenant, je passe l'examen avec un chrono visible ; chaque réponse est sauvegardée immédiatement.
- US-09 : En tant qu'apprenant, si ma connexion coupe ou si je ferme la page, je reprends mon examen là où j'en étais, avec le temps restant réel.
- US-10 : En tant qu'apprenant, quand le temps est écoulé, mon examen est envoyé automatiquement avec mes réponses déjà données.
- US-11 : En tant qu'apprenant, je vois mon score global, le score par module, réussi / échoué et les tentatives restantes (sur 3).
- US-12 : En tant qu'apprenant, je bascule entre français et anglais à tout moment, même pendant un examen, sans perdre ma tentative.

**Formateur**
- US-13 : En tant que formateur, je vois un tableau apprenants × modules pour mes promotions seulement (progression, meilleur score d'examen, tentatives).
- US-14 : En tant que formateur, j'exporte ce tableau en CSV.
- US-15 : En tant que formateur, je relis les questions en brouillon (fr et en), je les corrige et je les publie ; la publication est refusée si une langue manque ou n'est pas relue.

**Admin**
- US-16 : En tant qu'admin, je crée des promotions, je les associe à une formation et j'y rattache des formateurs.
- US-17 : En tant qu'admin, j'importe une liste d'apprenants depuis un CSV dans une promotion.
- US-18 : En tant qu'admin, j'importe ou je mets à jour le contenu (cours et questions) depuis les fichiers du dépôt avec une commande idempotente.
- US-19 : En tant qu'admin, je règle un examen (seuil, tentatives, durée, nombre de questions par module) ; les valeurs NetAcad sont proposées par défaut.
- US-20 : En tant qu'admin, une sauvegarde quotidienne de la base est faite automatiquement, et j'en garde 7.

### Modélisation logique des données
| Entité | Attributs clés | Relations / contraintes |
|---|---|---|
| **User** (personnalisé) | username, first_name, last_name, email (facultatif), role ∈ {learner, trainer, admin}, preferred_language | — |
| **Promotion** | name, start_date | FK Formation ; FK learners (User.role = learner, 1 promotion par apprenant) ; M2M trainers (User.role = trainer) |
| **Formation** | title*, slug, description*, order | 1-N Partie |
| **Partie** | title*, order, slug | FK Formation ; 1-1 Assessment (examen) |
| **Module** | title*, order, duration_hours, competence*, evaluation_note* | FK Partie ; 1-1 Assessment (quiz) |
| **Section** | title*, order, kind ∈ {content, practical}, body_md* | FK Module ; HTML rendu et nettoyé à l'affichage (avec cache) |
| **Annexe** | title*, file | FK Section (practical) |
| **Question** | prompt*, explanation*, qtype ∈ {single, multiple, truefalse}, usage ∈ {quiz, exam}, status ∈ {draft, published}, reviewed_fr, reviewed_en, image (FileField facultatif : webp/png/jpg/svg), external_id | FK Module ; publication impossible si `reviewed_fr` ou `reviewed_en` est faux ; truefalse = exactement 2 choix ; single = exactement 1 bonne réponse ; multiple ≥ 2 bonnes réponses |
| **Choice** | text*, is_correct, order | FK Question |
| **Assessment** | kind ∈ {module_quiz, part_exam}, pass_threshold (70), max_attempts (null = illimité ; 3 pour l'examen), duration_minutes (null ; 60), questions_per_module (examen), shuffle | 1-1 Module (quiz) **ou** 1-1 Partie (examen) |
| **Attempt** | started_at, deadline, submitted_at, auto_submitted, score_pct, passed, number | FK User, FK Assessment ; unique (user, assessment, number) ; au plus 1 tentative ouverte par (user, assessment) |
| **AttemptQuestion** | order, choice_order (JSON), selected_choices (M2M Choice), answered_at | FK Attempt, FK Question ; fige le tirage et l'ordre au démarrage ; porte aussi la réponse (ex-entité Answer) : modifiable seulement si l'heure serveur est avant la deadline et que la tentative n'est pas envoyée ; le score est recalculé à l'envoi (pas de champ `points`) |
| **SectionView** | viewed_at | FK User, FK Section ; unique (user, section) |

`*` = champ traduit (fr/en) via modeltranslation, avec repli sur le fr.
**Règles dérivées (calculées, non stockées)** : module terminé = toutes ses sections vues + ≥ 1 tentative de quiz envoyée ; examen ouvert = tous les modules de la partie terminés et tentatives < max ; score multiple = max(0, bonnes cochées − mauvaises cochées) / nombre de bonnes ; meilleure note = max(score_pct) des tentatives envoyées.

### Écarts d'implémentation validés (backend, 2026-10-17)
Décisions prises pendant l'implémentation TDD, qui priment sur le texte ci-dessus :
1. **Answer fusionnée dans AttemptQuestion** : la question tirée et la réponse de l'apprenant vivent dans la même ligne (une entité de moins, aucune perte de règle métier).
2. **Contenu importé en JSON, pas en YAML** : PyYAML ne fait pas partie des 4 dépendances autorisées. Format : `content/<formation>/formation.json` (manifeste) + `<partie>/<module>/<NN-section>.fr.md` / `.en.md` + `<partie>/<module>/questions.json`. Commande : `python manage.py import_content content/<formation>/formation.json` (idempotente ; une question publiée dont le texte change repasse en brouillon).
3. **Image de question = FileField** (extensions webp/png/jpg/jpeg/svg) au lieu d'ImageField : ImageField exige Pillow, exclu par le budget disque.
4. **Pas d'entité « Answer.points »** : le score est calculé à l'envoi par `assessments/scoring.py` (fractions exactes).
5. **Sauvegarde** : commande `python manage.py backup_db <dossier>` (API backup de SQLite, 7 copies gardées), à lancer par la tâche planifiée quotidienne de PythonAnywhere.
6. **Dépendances de développement** : `pytest` et `pytest-django` (`requirements-dev.txt`), jamais installées en production.
7. **Accès à l'admin dérivé du rôle** : un formateur devient `is_staff` avec le groupe « Formateurs » (questions et choix seulement) ; un admin reçoit le groupe « Administrateurs » (tout le contenu).

### Exigences non fonctionnelles
- Performance : TTFB < 500 ms sur PythonAnywhere pour les pages de cours ; ≤ 10 requêtes SQL par page.
- Poids : < 200 Ko transférés à la première visite d'une page de cours ; CSS et JS < 50 Ko au total.
- Accessibilité : contraste AA, navigation au clavier dans les quiz, `lang` correct par page.
- Fiabilité : aucune réponse d'examen perdue lors d'un rechargement ou d'une coupure.

## Guide de style de l'interface (validé le 2026-10-17)
Source : `static/acad/css/app.css` (CSS natif, aucun framework). Toute modification de style majeure doit être reportée ici.

**Charte (reprise de ventisax.pythonanywhere.com)**
- Couleurs : bleu marine `--navy #0b2d46` (titres, boutons), une seule couleur d'accent : turquoise (`--teal-ink #0d665e` en clair, `--teal #68ddce` en sombre) pour les états « vu / terminé / sélectionné ». Pas d'autre couleur d'accent.
- Mode sombre automatique (`prefers-color-scheme`), jetons redéfinis dans `:root`. Le logo reçoit un liseré en sombre (sinon il se fond dans le fond).
- Police : pile `"Lexend", system-ui…` sans fichier téléchargé (comme ventisax : aucune police web chargée).
- Formes : boutons et badges en pilule, panneaux 20px, champs et cartes de réponse 14px.
- Icônes : Tabler Icons 3.31.0 (MIT) en partiels `templates/icons/*.svg`, jamais de SVG dessiné à la main.
- Zéro tiret cadratin ou demi-cadratin dans les textes affichés.

**Règles de mise en page et d'accessibilité (vérifiées par l'audit Playwright `.playwright-mcp/audit.js`)**
- Contraste AA partout, en clair et en sombre.
- Mobile (< 700px) : toute cible tactile (liens de navigation, boutons, fil d'Ariane, entrées du sommaire, FR/EN) mesure au moins 44px de haut.
- Aucun défilement horizontal de page à 360px ; les tableaux larges défilent dans `.table-scroll` (qui est `position: relative` pour contenir les libellés `.visually-hidden`) avec la 1re colonne figée.
- Sous 480px : panneaux en `padding: 1rem`, boutons d'action (`.cta-row`, `.pager`) pleine largeur, badges de durée ou « Terminé » des modules masqués (l'état reste porté par la coche et un texte pour lecteurs d'écran).
- Sous 400px, en-tête formateur ou admin (5 commandes) : le nom « Acad Ventisax » est masqué visuellement, le logo seul porte la marque (nom toujours lu par les lecteurs d'écran).
- Sommaire du lecteur replié par défaut sur mobile, ouvert à partir de 960px.
- Quiz et examen : navigation au clavier par flèches ; l'anneau de focus entoure toute la carte de réponse (`.choice:has(input:focus-visible)`).
- Une rangée de badges vide (`.facts`) est masquée pour ne pas créer d'espace parasite sous le titre.

**Budget mesuré** : page la plus lourde (examen) ≈ 32 Ko à la première visite ; CSS + JS = 22 Ko compressés (gzip), 70 Ko bruts.

**Points ouverts**
- PRD « CSS et JS < 50 Ko au total » : respecté en transfert compressé (22 Ko), dépassé en brut (70 Ko, dont HTMX 51 Ko). Vérifier que PythonAnywhere sert les fichiers statiques compressés, sinon remplacer HTMX par un petit `fetch` natif (décision Q13 à revoir).

## Traduction de l'interface et versionnement des fichiers statiques (2026-10-17)

**Interface anglaise**
- Chaînes sources en français dans les gabarits (`{% translate %}`, `{% blocktranslate %}`) et le code (`gettext_lazy`). Traductions dans `locale/en/LC_MESSAGES/django.po` (169 chaînes, pluriels compris) ; le `.mo` compilé est versionné pour que le serveur n'ait pas besoin de gettext.
- Mettre à jour après tout ajout de texte :
  `python manage.py makemessages -l en --ignore=.venv --ignore=reference --ignore=staticfiles --ignore=.playwright-mcp --ignore=conftest.py --ignore="*/tests/*"` puis traduire, puis `python manage.py compilemessages -l en --ignore=.venv`.
- Sous Windows, gettext s'installe avec `winget install mlocati.GetText --scope user` (binaires dans `%LOCALAPPDATA%\Programs\gettext-iconv\bin`, à ajouter au PATH).
- Garde-fou : `accounts/tests/test_i18n.py` échoue si une chaîne du `.po` est vide ou marquée `fuzzy`, et vérifie les écrans clés en anglais.
- Contenu non traduit affiché en repli français : le filtre `{{ objet|lang_attr:"title" }}` (`courses/templatetags/acad_i18n.py`) ajoute `lang="fr"` pour que les lecteurs d'écran le prononcent en français ; le corps d'une section garde le badge « FR ».

**Contenu des cours bilingue (`content/froid/`)**
- `formation.json` + `p1/m1…m6/*.fr.md` / `*.en.md` + `p1/m*/questions.json` : **Partie 1 entièrement transcrite** depuis `reference/cours/01_partie1` (44 photos, dont 3 doublons exacts `02/2`, `03/3`, `04/4` et 2 clichés de la même page « habilitation électrique », soit 41 pages distinctes), avec sa traduction anglaise : 31 sections. Titres et durées conformes au support : 1 Sécurité dans les travaux (8 h), 2 Techniques de rédaction des rapports (16 h), 3 Travail en hauteur (4 h), 4 Travaux en espaces confinés et habilitation électrique (4 h), 5 Utilisation d'une fiche de maintenance ou d'intervention (8 h), 6 Recherche Internet (8 h).
- Choix de transcription : les pages 2 à 4 (présentation générale) forment la section « Présentation de la formation » du module 1 ; la page « habilitation électrique » rangée dans le dossier du module 3 est rattachée au module 4, comme le prévoit le programme ; les galeries de photos d'EPI sont résumées en tableau (équipement, usage, référence) ; pour les formulaires du module 5 (rapport de service, feuille de travail, certificat d'essais), seuls la structure et les valeurs de référence sont repris, jamais les données manuscrites (noms, clients) ; les coquilles évidentes sont corrigées (« 1 bar = 105 Pa » devient 10⁵ Pa).
- **73 questions** (36 de quiz, 37 d'examen), toutes en français et en anglais, rédigées par Claude à partir du texte transcrit. **Relecture approuvée par le formateur (propriétaire du projet) le 2026-10-17** : `reviewed` vaut `true` en français et en anglais, et les 73 questions ont été publiées par le compte formateur dans l'admin. Toute nouvelle question entre avec `reviewed` à `false` jusqu'à une nouvelle approbation (règle Q11b). Chaque question porte un champ `section` qui cite la section du cours dont elle est tirée (ignoré à l'import, utilisé par les tests).
- Règles de la banque de questions (vérifiées par les tests) : chaque section de cours (hors activités pratiques) a au moins une question ; chaque module a au moins 4 questions de quiz et 4 d'examen ; chaque question est publiable une fois relue (une seule bonne réponse en QCM simple, au moins deux en QCM multiple, deux choix en Vrai/Faux) ; les drapeaux de relecture sont explicites pour les deux langues ; l'import ne publie jamais tout seul.
- Garde-fous : `courses/tests/test_content_files.py` échoue si un texte manque dans l'une des deux langues ou si un fichier Markdown n'est pas référencé par le manifeste.
- Import : `python manage.py import_content content/froid/formation.json` (idempotent).
- Publication après un import (par exemple sur PythonAnywhere) : le formateur se connecte, ouvre « Gestion » puis « Questions », sélectionne tout, lance « Marquer comme relues (FR et EN) » si besoin, puis « Publier les questions sélectionnées ». Les questions refusées (choix incohérents) restent en brouillon avec la raison affichée.

**Versionnement anti-cache des CSS et JS**
- Production (`DJANGO_DEBUG=0`) : `ManifestStaticFilesStorage`, l'empreinte du contenu est dans le nom (`app.3f9c….css`) après `collectstatic`. Une modification crée une nouvelle URL ; les anciennes peuvent être mises en cache longtemps.
- Développement : `config.storage.VersionedStaticFilesStorage` ajoute `?v=<empreinte du contenu>` à chaque URL `{% static %}` ; plus besoin de vider le cache du navigateur.
- Toujours référencer CSS, JS et images par `{% static %}`, jamais par une URL écrite en dur. `STATIC_ROOT` est réglable par `DJANGO_STATIC_ROOT`.
- Testé par `config/tests/test_static_versioning.py` (y compris un `collectstatic` de production réel).

## Definition of Done (critères stricts)
Une user story ou une fonctionnalité n'est **terminée** que si **tous** les points sont vrais :
1. **Tests** : `python manage.py test` passe à 100 %. Toute règle métier touchée a ses tests : notation partielle et plancher 0, seuil de 70 %, 3 tentatives et meilleure note, deadline et envoi automatique, reprise de tentative, déblocage de l'examen, cloisonnement formateur ↔ promotion, refus de publication sans double relecture, repli de langue.
2. **E2E** : le scénario Playwright de la story passe en local sur un viewport mobile (360×800) : connexion → lecture → quiz → examen avec rechargement en cours → résultat → bascule /fr/ ↔ /en/.
3. **Bilingue** : toute chaîne d'interface est dans les fichiers `.po`, fr et en, avec `compilemessages` sans erreur ; aucune chaîne en dur.
4. **Sécurité** : `python manage.py check --deploy` sans avertissement bloquant avec les réglages de production ; aucun secret dans le diff (vérifié par une recherche) ; contrôle d'accès testé (un apprenant ne voit pas une autre promotion ; un formateur ne voit que ses promotions).
5. **Budget** : le poids du projet + venv reste < 150 Mo (`du -sh`) ; la page touchée transfère < 200 Ko (mesure Playwright).
6. **Données** : les migrations sont créées et appliquées sur une base vide ; `import_content` est idempotent (deux exécutions, aucun doublon).
7. **Interface** : relue avec la grille design-taste-frontend ; aucun texte ni asset NetAcad ; capture mobile jointe à la PR.
8. **Contenu** (stories de contenu) : sections transcrites fidèles aux photos (relecture humaine cochée), questions au statut `draft` jusqu'à validation du formateur.
9. **Déploiement** (jalon de release) : `deploy.sh` exécuté sur PythonAnywhere ; /fr/ et /en/ répondent 200 ; l'admin est accessible ; la tâche de sauvegarde a produit un fichier.
10. **Documentation** : AGENTS.md est mis à jour si une décision change ; pas de TODO non suivi dans le code livré.
