# CLAUDE.md : Acad Ventisax

> Les instructions du projet sont dans **AGENTS.md**, qui est la source de vérité. En cas de divergence, AGENTS.md prime.
> Ce fichier en reprend le contenu pour Claude Code.

## Commandes utiles (à compléter quand le code existera)
- `python manage.py test`
- `python manage.py import_content`
- `./deploy.sh` (sur PythonAnywhere)


Plateforme Django + SQLite hébergée sur https://acadventisax.pythonanywhere.com/fr/ (compte PythonAnywhere `acadventisax`, plan gratuit).
Le site vitrine https://ventisax.pythonanywhere.com/fr/ y renvoie par un simple lien.
Le contenu source est dans `reference/` : photos du support de cours « Froid et climatisation » du centre LA VOCATION (Partie 1, 6 modules ; Partie 2 « Les bases de l'électricité domestique », 8 modules) et planning.

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
| Q14 | Déploiement et exploitation ? | GitHub → `deploy.sh` sur PythonAnywhere ; sauvegarde SQLite quotidienne (1 copie, la plus récente) ; DEBUG=False, HTTPS |
| Q15 | Contenu de la v1 ? | Partie 1 complète (6 modules), puis Partie 2 (8 modules, Q17 à Q30), transcrite le 2026-10-21 |
| Q16 | Comment observer NetAcad ? | L'utilisateur se connecte lui-même dans le Chrome CDP (`/cloner-webapp`) ; 4 écrans observés ; principes d'interface seulement |
| Q17 | Combien de modules en Partie 2 (le sommaire du support en annonce 7, le corps en contient 8) ? | 8 modules : 1 Notions de base en électricité, appareillages et outils de l'électricien ; 2 Projet de création d'une installation électrique d'une nouvelle résidence ; 3 Montage simple allumage ; 4 Montage double allumage ; 5 Montage va-et-vient ; 6 Montage télérupteur ; 7 Montage d'une minuterie ; 8 Montage et réglage d'une horloge. Interrupteur crépusculaire et détecteur de mouvement hors v1 (aucune page dans le support) |
| Q18 | Que faire du PDF NF C 15-100 (norme AFNOR, 8 Mo) ? | Source de travail seulement : règles reformulées et citées « NF C 15-100 » ; le PDF n'est ni dans le dépôt ni sur le serveur |
| Q19 | Comment afficher les schémas (architectural, développé, unifilaire, symboles) ? | Schémas redessinés en SVG (2 à 6 Ko, `validate_inert_svg`) ; la règle « jamais de SVG dessiné à la main » ne vise que les icônes d'interface |
| Q20 | Où mettre les images de cours, et comment le Markdown les appelle-t-il ? | Fichiers statiques versionnés à côté du texte (`content/froid/p2/mN/img/`) ; chemin relatif dans le Markdown, réécrit en URL `{% static %}` (empreinte, gzip) au rendu ; SVG sur fond clair fixe, lisible en mode sombre |
| Q21 | Le module 2 (2 pages imprimées et 3 photos du tableau noir) est trop mince pour 8 h : que fait-on ? | On transcrit, puis on développe chaque étape d'après la NF C 15-100, sur le cas du tableau noir ; plan de maison redessiné en SVG (pas l'image d'internet) ; valeurs à la craie recoupées avec la norme |
| Q22 | Comment marquer le contenu rédigé par Claude ? | Champ `Section.is_supplement` (`"supplement": true` dans le manifeste), badge « Complément » dans le sommaire et en tête de section, filtre dans l'admin ; une section est soit transcrite, soit rédigée. Les compléments sont publiés sans validation préalable du formateur |
| Q23 | Questions de la Partie 2 : brouillon jusqu'à relecture (Q11b) ou publiées d'office ? | Publiées d'office (quiz et examen), `reviewed` fr/en à `true` dans `questions.json` ; dérogation à Q11b approuvée par le propriétaire le 2026-10-20 |
| Q24 | Par quel mécanisme publier d'office, et jusqu'où va la dérogation ? | Option `import_content --publish` : appelle `Question.publish()` sur les questions relues fr et en, et liste les refus ; sans l'option, rien ne change. Dérogation limitée à la Partie 2 ; Q11b reste la règle par défaut |
| Q25 | Combien de questions, et quel examen pour 8 modules ? | Banque de 8 questions de quiz et 8 d'examen par module (au moins 1 par section) ; tirage de 5 par module, soit 40 questions en 60 min ; `"exam": {"questions_per_module": 5}` dans `formation.json`, appliqué par l'import ; 70 %, 3 tentatives et mélange inchangés |
| Q26 | Que faire des images copiées d'internet (schéma de frigo légendé en indonésien p. 35, maison filigranée, photos de produits) ? | Aucune photo en Partie 2 : schémas tiers redessinés en SVG simplifié (seulement l'utile), maison remplacée par le plan SVG, photos de produits remplacées par des tableaux (appareil, usage, plaque), plus un SVG quand la forme compte |
| Q27 | Quel anglais pour l'électricité ? | Vocabulaire IEC et anglais britannique (two-way switching, intermediate switching, impulse relay, staircase timer, RCD, MCB, time switch) ; NF C 15-100 citée (« IEC 60364 » à la 1re mention) ; Eneo et couleurs de fils inchangés ; terme français entre parenthèses à la 1re occurrence ; glossaire fr ↔ en dans la présentation de la Partie 2 |
| Q28 | En quelle langue écrire dans les SVG ? | Repères normalisés neutres (L, N, PE, F1, S1, K1, ①…), légende et `alt` traduits dans le Markdown ; `.fr.svg` et `.en.svg` seulement pour les schémas dont le texte est le contenu (synopsis, plan) ; un test vérifie que tout `.fr.svg` a son `.en.svg` |
| Q29 | Que faire quand le support se trompe techniquement ? | Correction dans le texte, sans note pour l'apprenant ; chaque correction de fond (page, texte d'origine, correction, justification) est consignée dans `content/froid/p2/CORRECTIONS.md` |
| Q30 | Ordre des livraisons et points de validation ? | J0 grill consigné → J1 code et tests, plus une section d'essai (module 3) pour valider le style des SVG → J2 modules 1 à 4 → J3 modules 5 à 8 → J4 publication, Playwright 360×800, Definition of Done, déploiement sur demande ; arrêt pour validation après chaque jalon ; commit sur `develop`, sans push sans accord |

## GOALS

### 1. Objectifs fonctionnels prioritaires
1. **Lecteur de cours** : Formation → Partie → Module → Section, avec un sommaire repliable et une barre de progression par module et par partie.
2. **Quiz de module** : entraînement illimité, correction et explication affichées après envoi.
3. **Examen de partie** : banque séparée, 70 % pour réussir, 3 tentatives, 60 min chronométrées côté serveur, reprise après coupure, envoi automatique.
4. **Progression** : navigation libre ; l'examen se débloque quand tous les modules de la partie sont terminés.
5. **Comptes et promotions** : créés par l'admin (import CSV) ; trois rôles ; cloisonnement par promotion.
6. **Tableau formateur** : apprenants × modules (progression, meilleur score d'examen) et export CSV.
7. **Workflow éditorial** : questions brouillon → publiées par un formateur, seulement quand fr et en sont relus. Dérogation pour la Partie 2 : questions approuvées d'avance par le propriétaire et publiées par `import_content --publish` (Q23, Q24).
8. **Contenu v1, Partie 1** : 6 modules transcrits et bilingues, avec ≈ 12 questions de quiz et ≈ 10 questions d'examen par module.
9. **Contenu, Partie 2 « Les bases de l'électricité domestique »** : 8 modules (Q17) transcrits et bilingues, chacun avec sa section d'activités pratiques (TAF) ; module 2 développé d'après la NF C 15-100 sur le cas du tableau noir (Q21) ; banque de 8 questions de quiz et 8 d'examen par module, examen de 40 questions tirées (5 par module) en 60 min (Q25) ; glossaire fr ↔ en (Q27).
10. **Schémas de cours** : schémas électriques redessinés en SVG, aucune photo en Partie 2 ; repères normalisés dans le dessin, légende et texte alternatif traduits (Q19, Q26, Q28).
11. **Provenance visible** : toute section rédigée par Claude (et non transcrite) porte le badge « Complément » et se filtre dans l'admin ; les corrections de fond du support sont journalisées dans `content/froid/p2/CORRECTIONS.md` (Q22, Q29).
12. **Interface** : bilingue /fr/ et /en/, mobile d'abord, patterns NetAcad, charte Ventisax.

### 2. Contraintes techniques
- Python le plus récent proposé par PythonAnywhere ; **Django 5.2 LTS** ; **SQLite** (un seul fichier, sauvegardé chaque jour).
- Rendu serveur (gabarits Django) + **HTMX vendoré** ; aucun CDN, aucun Node, aucune SPA.
- Dépendances autorisées : `django`, `django-modeltranslation`, `markdown`, `bleach`. Toute autre dépendance demande un accord explicite.
- **Disque < 150 Mo** (code + venv + base + médias) sur un quota de 512 Mo ; photos en WebP, schémas en SVG ; **pages < 200 Ko** à la première visite.
- Images de cours : fichiers statiques versionnés dans `content/<formation>/<partie>/<module>/img/`, appelés en chemin relatif dans le Markdown et réécrits en URL `{% static %}` au rendu ; SVG de 2 à 6 Ko, inertes (`validate_inert_svg`), sur fond clair fixe ; `.fr.svg` / `.en.svg` seulement pour les schémas dont le texte est le contenu (Q20, Q28).
- Manifeste `formation.json` : `"supplement": true` par section et `"exam": {"questions_per_module": N}` par partie, appliqués par l'import idempotent (Q22, Q25).
- Normes : la NF C 15-100 sert de source de travail, reformulée et citée, jamais versionnée ni servie (Q18) ; anglais technique IEC / britannique, contexte camerounais conservé (Eneo, couleurs de fils du support) (Q27).
- i18n : `i18n_patterns`, préfixes /fr/ (par défaut) et /en/, gettext pour l'interface, modeltranslation pour le contenu, repli sur le fr.
- Plan gratuit PythonAnywhere : une web app, internet sortant sur liste blanche, aucune tâche planifiée ni permanente (constaté le 2026-10-17 : réservées aux comptes payants).
- Sécurité : DEBUG=False en production, HTTPS forcé, CSRF actif, HTML Markdown nettoyé par bleach, secrets dans `.env`, identifiants publics UUID dans les URL et les formulaires, en-tête CSP sans script en ligne (voir « Audit de sécurité et tests d'intrusion »).
- Déploiement : `deploy.sh` (pull, install, migrate, compilemessages, collectstatic, reload).

### 3. Périmètre strictement hors scope (v1)
- Inscription publique, mot de passe oublié par e-mail, SSO ou base partagée avec ventisax, toute modification du dépôt ventisax.
- Planning et calendrier des séances, gestion des formateurs par séance.
- Attestations ou certificats PDF, badges.
- Évaluation pratique notée, grilles d'observation, dépôt de fichiers par les apprenants.
- Questions d'appariement, glisser-déposer, zone cliquable sur image, réponse libre.
- Parcours séquentiel bloquant.
- Mode hors ligne / PWA, application mobile native.
- Parties 3 et suivantes de la formation ; interrupteur crépusculaire et détecteur de mouvement (annoncés par le sommaire de la Partie 2, sans page dans le support).
- Toute reprise de textes, questions, logos ou assets de NetAcad/Cisco.
- Photos ou images tirées d'internet ou de catalogues dans le contenu de la Partie 2 ; republication du texte ou du PDF de la NF C 15-100.
- Note visible par l'apprenant sur les erreurs corrigées du support (journal formateur seulement).
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
- US-20 : En tant qu'admin, une sauvegarde quotidienne de la base est faite automatiquement, et seule la plus récente est gardée (décision du 2026-10-17, pour limiter le disque).

**Partie 2 : bases de l'électricité domestique (2026-10-20)**
*Apprenant*
- US-21 : En tant qu'apprenant, je suis les 8 modules de la Partie 2 dans le même lecteur que la Partie 1, avec la même progression et le même déblocage de l'examen.
- US-22 : En tant qu'apprenant, je lis chaque schéma (architectural, développé, unifilaire, symboles) sur un téléphone de 360 px, en mode clair comme sombre, avec une légende et un texte alternatif dans ma langue.
- US-23 : En tant qu'apprenant, je reconnais au badge « Complément » les sections rédigées en plus du support imprimé.
- US-24 : En tant qu'apprenant anglophone, je lis le vocabulaire IEC avec le terme français entre parenthèses à la 1re occurrence, et je consulte un glossaire fr ↔ en dans la présentation de la Partie 2.
- US-25 : En tant qu'apprenant, je consulte l'activité pratique (TAF) de chaque module : consignes, matériel et outillage, séquence de réalisation, temps estimé, éléments d'évaluation.
- US-26 : En tant qu'apprenant, je passe l'examen de la Partie 2 : 40 questions (5 par module) en 60 min, avec un tirage différent à chaque tentative.

*Formateur*
- US-27 : En tant que formateur, je filtre dans l'admin les sections « Complément » (lecture seule) pour les relire après publication, et je consulte `content/froid/p2/CORRECTIONS.md` pour voir chaque correction de fond apportée au support.

*Admin*
- US-28 : En tant qu'admin, je lance `import_content … --publish` : les questions relues fr et en sont publiées, les refus sont listés avec leur raison ; sans l'option, rien n'est publié.
- US-29 : En tant qu'admin, le nombre de questions d'examen par module est lu dans `formation.json` (`exam.questions_per_module`) et réappliqué à chaque import, sans réglage à la main sur le serveur.

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
Formation, Partie, Module, Section, Question, Choice et Attempt portent en plus un `public_id` (UUID v4, unique, non modifiable) : c'est le seul identifiant qui sort de la base (URL, champs de formulaire, ancres HTML). Les clés entières restent internes (jointures, admin réservé au personnel).
**Règles dérivées (calculées, non stockées)** : module terminé = toutes ses sections vues + ≥ 1 tentative de quiz envoyée ; examen ouvert = tous les modules de la partie terminés et tentatives < max ; score multiple = max(0, bonnes cochées − mauvaises cochées) / nombre de bonnes ; meilleure note = max(score_pct) des tentatives envoyées.

**Évolutions pour la Partie 2 (2026-10-20)**
| Entité | Changement | Contraintes |
|---|---|---|
| **Section** | + `is_supplement` (booléen, faux par défaut), alimenté par `"supplement": true` dans le manifeste | une section `practical` n'est jamais un complément ; une section est soit transcrite, soit rédigée, jamais les deux |
| **Assessment** (part_exam) | `questions_per_module` écrit par l'import quand la partie a une clé `exam` ; sinon la valeur en base est gardée | ≥ 1 ; tirage = min(N, questions d'examen publiées du module) |
| **Question** | aucun champ nouveau ; `reviewed_fr` / `reviewed_en` à vrai dans `p2/m*/questions.json` | la publication passe toujours par `Question.publish()` (cohérence des choix vérifiée) |
| **Image de cours** | pas d'entité : fichiers statiques `content/<formation>/<partie>/<module>/img/*.svg` | appelés en chemin relatif dans `body_md`, réécrits en URL `{% static %}` par `courses/rendering.py` ; un chemin inconnu fait échouer l'import (jamais d'image cassée) |
| **Groupe « Formateurs »** | + permission `view_section` | lecture seule, aucune édition du contenu |

Règle dérivée : examen de la Partie 2 = 8 modules × 5 = 40 questions tirées dans une banque de 8 questions d'examen par module.

### Écarts d'implémentation validés (backend, 2026-10-17)
Décisions prises pendant l'implémentation TDD, qui priment sur le texte ci-dessus :
1. **Answer fusionnée dans AttemptQuestion** : la question tirée et la réponse de l'apprenant vivent dans la même ligne (une entité de moins, aucune perte de règle métier).
2. **Contenu importé en JSON, pas en YAML** : PyYAML ne fait pas partie des 4 dépendances autorisées. Format : `content/<formation>/formation.json` (manifeste) + `<partie>/<module>/<NN-section>.fr.md` / `.en.md` + `<partie>/<module>/questions.json`. Commande : `python manage.py import_content content/<formation>/formation.json` (idempotente ; une question publiée dont le texte change repasse en brouillon).
3. **Image de question = FileField** (extensions webp/png/jpg/jpeg/svg) au lieu d'ImageField : ImageField exige Pillow, exclu par le budget disque.
4. **Pas d'entité « Answer.points »** : le score est calculé à l'envoi par `assessments/scoring.py` (fractions exactes).
5. **Sauvegarde** : commande `python manage.py backup_db <dossier>` (API backup de SQLite ; seule la nouvelle copie est gardée, les anciennes ne sont supprimées qu'après son écriture), lancée automatiquement par `progress.middleware.DailyBackupMiddleware` : la première requête qui suit 24 h sans copie déclenche la sauvegarde dans `DJANGO_BACKUP_DIR` (désactivée si la variable est vide ; une erreur est journalisée sans casser la page). Le plan gratuit n'ayant pas de tâche planifiée, aucun jour sans visite ne produit de copie, ce qui est sans conséquence puisque la base n'a alors pas changé.
6. **Dépendances de développement** : `pytest` et `pytest-django` (`requirements-dev.txt`), jamais installées en production.
7. **Accès à l'admin dérivé du rôle** : un formateur devient `is_staff` avec le groupe « Formateurs » (questions et choix seulement) ; un admin reçoit le groupe « Administrateurs » (tout le contenu).
8. **Identifiants publics UUID** (2026-10-17) : les URL passent de `/modules/12/` à `/modules/<uuid>/` (convertisseur `<uuid:…>`), le formulaire de réponse envoie l'UUID de la question et des choix, et `assessments.services.save_answer` les attend. Migrations en trois temps (champ nullable, une valeur par ligne, puis unicité) : `courses/0002_public_ids`, `assessments/0004_public_ids`.
9. **Entité LoginFailure** (accounts) : un échec de connexion par ligne, purgé après `LOGIN_LOCKOUT` ; sert au verrouillage anti force brute.
10. **Backend de la Partie 2 (TDD, 2026-10-20)** : migration `courses/0003_section_is_supplement` ; erreurs de contenu levées par `courses.importer.ContentError` (import annulé, `CommandError` côté commande) : section pratique marquée complément, `exam.questions_per_module` < 1, image absente, SVG actif. Les images `img/x.svg` d'un `.md` deviennent `cours/<formation>/<dossier du module>/img/x.svg`, servies par `courses.finders.ContentImagesFinder` (racine `ACAD_CONTENT_ROOT`) qui ne laisse sortir que les `.svg`/`.webp` d'un dossier `img/`, jamais `questions.json` ni les `.md` (test d'intrusion `test_course_static_files_never_expose_answers_or_sources`). Les droits des groupes « Formateurs » et « Administrateurs » sont désormais **ajoutés** à chaque synchronisation (un groupe déjà créé en production reçoit `view_section`). Un nouvel examen tire d'abord les questions absentes de la tentative précédente (`Assessment.question_pool(previous=…)`, US-26). bleach garde `<span lang="fr">` pour les termes français cités en anglais (US-24). `.prose img` : `height: auto`, fond blanc fixe (lisible en sombre), vérifié dans Chromium à 360 px en mode sombre (aucun défilement horizontal). Un nouvel import supprime les sections retirées du manifeste (sinon une section orpheline, jamais vue, bloquerait la fin du module et l'examen, US-21) ; le sommaire signale l'activité pratique par le badge « Pratique » (US-25).
11. **Gabarits et rendu vérifiés dans Playwright (2026-10-21)** : pages d'erreur à la charte et bilingues (en production, plus jamais la page brute de Django ; l'examen verrouillé lève `PermissionDenied` au lieu d'un 403 vide) ; `ContentImagesFinder` accepte les `\` que `runserver` transmet sous Windows (le schéma était invisible en développement local) ; SQLite en `transaction_mode = IMMEDIATE` avec `timeout = 20` : deux sauvegardes de réponse simultanées s'interbloquaient (« database is locked », réponse perdue), constaté en cochant vite un quiz puis reproduit par `config/tests/test_sqlite_concurrency.py`. Contrôles à 360 et 1280 px, clair et sombre : aucun défilement horizontal, badges en contraste AA (6 à 10:1), schéma SVG chargé sur fond blanc. 289 tests au vert (302 après l'audit S11 à S14).
12. **Contenu de la Partie 2 (J1 à J3, 2026-10-21)** : transcription des 38 photos de `reference/cours/02_partie2` en 8 modules, 36 sections fr/en (dont 4 compléments : glossaire, plan d'implantation, puissance, câble et devis) et 128 questions (8 de quiz et 8 d'examen par module, relues d'avance, Q23) ; 22 schémas SVG inertes de 1 à 5 Ko (repères neutres, variantes `.fr.svg`/`.en.svg` pour le synopsis et le plan de la maison) ; 14 corrections de fond journalisées dans `content/froid/p2/CORRECTIONS.md` (dont l'ohmmètre utilisé hors tension et le calibre des différentiels du tableau noir). Les jalons J1 à J3 ont été enchaînés sans arrêt intermédiaire à la demande du propriétaire (« déploie la partie 2 en production »). Un schéma de cours s'ouvre en grand d'un toucher (`<a class="diagram">` posé par `courses/rendering.py`, pour zoomer sur téléphone) ; le schéma unifilaire est dessiné en 400 de large, un groupe différentiel par ligne, pour rester lisible à 360 px. Garde-fous ajoutés (`courses/tests/test_content_files.py`) : 8 modules de Q17, examen à 40 questions (5 par module, deux tirages différents), une activité pratique par module, glossaire CEI, format du journal des corrections, aucune mention de correction dans le texte servi. 312 tests au vert.

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

**Règles de mise en page et d'accessibilité (vérifiées par l'audit Playwright `.playwright-mcp/prd-audit.js` (12 écrans, 360, 390, 768 et 1280 px, clair et sombre ; hors dépôt, sessions de développement))**
- Contraste AA partout, en clair et en sombre.
- Mobile (< 700px) : toute cible tactile (liens de navigation, boutons, fil d'Ariane, entrées du sommaire, FR/EN) mesure au moins 44px de haut.
- Aucun défilement horizontal de page à 360px ; les tableaux larges défilent dans `.table-scroll` (qui est `position: relative` pour contenir les libellés `.visually-hidden`) avec la 1re colonne figée.
- Sous 480px : panneaux en `padding: 1rem`, boutons d'action (`.cta-row`, `.pager`) pleine largeur, badges de durée ou « Terminé » des modules masqués (l'état reste porté par la coche et un texte pour lecteurs d'écran).
- Sous 400px, en-tête formateur ou admin (5 commandes) : le nom « Acad Ventisax » est masqué visuellement, le logo seul porte la marque (nom toujours lu par les lecteurs d'écran).
- Sommaire du lecteur replié par défaut sur mobile, ouvert à partir de 960px.
- Quiz et examen : navigation au clavier par flèches ; l'anneau de focus entoure toute la carte de réponse (`.choice:has(input:focus-visible)`).
- Une rangée de badges vide (`.facts`) est masquée pour ne pas créer d'espace parasite sous le titre.
- Tableaux du cours (`.prose table`) : `display: block` et `overflow-x: auto`, ils défilent dans leur cadre ; la colonne du lecteur est en `minmax(0, 1fr)` dès le mobile, sinon un tableau large élargit toute la page (2026-10-21).
- Schémas de cours : fond blanc fixe, cliquables vers le fichier SVG (`.prose a.diagram`, curseur loupe) ; dessin de 640 de large au plus, 400 quand il porte beaucoup de repères (2026-10-21).
- « Mes cours » reste une **liste ordonnée**, sans bascule liste/grille : les modules forment une progression numérotée, et à 360 px une grille n'aurait qu'une colonne (avis design-taste-frontend du 2026-10-21). Chaque partie affiche sous son titre le nombre de modules et la durée totale (`.part-meta`), un bouton « Continuer » vers le premier module non terminé (absent quand tout est terminé), et sa carte d'examen porte le nom de la partie ; deux parties successives sont séparées de 1,5rem (`.course + .course`).
- Tableau formateur : colonnes de modules repérées « partie.module » (2.3 = module 3 de la partie 2, comme dans le cours), légende en liste de définitions sur plusieurs colonnes (`dl.table-legend`).
- Aucun attribut `style=` dans les gabarits, sauf la largeur calculée d'une barre de progression : les espacements passent par des classes nommées (`.spaced`, `.spaced-lg`, `.list-heading`, `.formation-block`, `.table-legend`) ; vérifié par `config/tests/test_templates.py`.
- Tout bouton d'action principal est dans une `.cta-row` (formulaire compris : `<form class="cta-row">`) pour hériter de la pleine largeur sous 480px.
- Correction de quiz : une réponse longue garde au moins 10rem de large ; le badge « Votre réponse » passe à la ligne au lieu de la comprimer.
- Sous 480px, le bouton d'envoi d'une tentative (`.submit-zone`) est aussi pleine largeur ; l'espace réservé vide du pager (pas de « Précédent ») est masqué pour que « Suivant » s'aligne sur le bord du texte (2026-10-21).
- Sommaire : la coche ou la pastille d'une entrée est calée sur la 1re ligne du titre (`align-items: flex-start` + `margin-top: calc((1lh - taille) / 2)`) ; une entrée d'une seule ligne reste centrée dans ses 44px grâce à `padding-block: max(.4rem, calc((44px - 1lh) / 2))` (2026-10-21).
- Quiz et examen : l'espace sous la dernière réponse est volontaire (`.save-state` réserve la ligne du message « Enregistré » pour éviter tout saut de mise en page).
- Pages d'erreur (`templates/400.html`, `403.html`, `403_csrf.html`, `404.html`, `500.html`, sur `_error.html`) : panneau à la charte, pastille d'icône, titre, une phrase, un seul bouton « Retour à mes cours ».

**Budget mesuré** : page la plus lourde (examen) ≈ 32 Ko à la première visite ; CSS + JS = 22 Ko compressés (gzip), 70 Ko bruts.

**Point résolu (2026-10-17)**
- PRD « CSS et JS < 50 Ko au total » : respecté en transfert compressé (22 Ko) ; PythonAnywhere sert bien les fichiers statiques en gzip (vérifié en production), HTMX est donc conservé (70 Ko bruts, dont HTMX 51 Ko).

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
- **Partie 2 « Les bases de l'électricité domestique »** (`p2/m1` à `p2/m8`, 2026-10-21) : 8 modules de 8 h, 36 sections, 128 questions publiées par `import_content … --publish` (Q23, Q24), examen de 40 questions tirées (5 par module) réglé par `"exam": {"questions_per_module": 5}`. Choix de transcription : le module 1 commence par la présentation de la partie (pages 1 et 2) et un glossaire fr ↔ en (complément) ; le module 2 transcrit les 7 étapes, le synopsis et le schéma unifilaire du tableau noir (valeurs recoupées avec la NF C 15-100), et développe en compléments le plan d'implantation, le bilan de puissance, le câble d'arrivée et le devis ; les photos de produits sont remplacées par des tableaux, les schémas par des SVG redessinés ; l'activité pratique du module 8, absente du support, suit le modèle des modules 3 à 7. Après un déploiement, lancer `python manage.py import_content content/froid/formation.json --publish` pour publier les questions relues.
- Import : `python manage.py import_content content/froid/formation.json` (idempotent).
- Publication après un import (par exemple sur PythonAnywhere) : le formateur se connecte, ouvre « Gestion » puis « Questions », sélectionne tout, lance « Marquer comme relues (FR et EN) » si besoin, puis « Publier les questions sélectionnées ». Les questions refusées (choix incohérents) restent en brouillon avec la raison affichée.

**Versionnement anti-cache des CSS et JS**
- Production (`DJANGO_DEBUG=0`) : `ManifestStaticFilesStorage`, l'empreinte du contenu est dans le nom (`app.3f9c….css`) après `collectstatic`. Une modification crée une nouvelle URL ; les anciennes peuvent être mises en cache longtemps.
- Développement : `config.storage.VersionedStaticFilesStorage` ajoute `?v=<empreinte du contenu>` à chaque URL `{% static %}` ; plus besoin de vider le cache du navigateur.
- Toujours référencer CSS, JS et images par `{% static %}`, jamais par une URL écrite en dur. `STATIC_ROOT` est réglable par `DJANGO_STATIC_ROOT`.
- Testé par `config/tests/test_static_versioning.py` (y compris un `collectstatic` de production réel).

## Audit de sécurité et tests d'intrusion (2026-10-17, complété le 2026-10-21)
Audit du code de la v1 (vues, gabarits, réglages, import, export, téléversements). Chaque faille est rejouée par un test d'intrusion dans `config/tests/test_intrusion.py` (62 cas au 2026-10-17, 79 au 2026-10-21), écrit avant le correctif puis vu au vert.

| # | Faille constatée | Famille | Correctif | Test(s) |
|---|---|---|---|---|
| S1 | Identifiants séquentiels dans les URL et formulaires (`/tentatives/8/`, `value="17"`) : volume de données, nombre d'apprenants et de tentatives déductibles | Énumération / déduction | `public_id` UUID v4 sur 7 modèles, convertisseur `<uuid:…>`, ancres HTML en UUID | `test_every_exposed_model_has_a_random_public_uuid`, `test_sequential_integer_urls_no_longer_exist`, `test_pages_never_reveal_database_ids` |
| S2 | Fichiers téléversés gardant leur nom d'origine (`annexes/Fiche client Dupont.pdf`), servis sans authentification | Déduction | `config.uploads.RandomFilename` : `<dossier>/<uuid>.<ext>` | `test_uploaded_files_get_unguessable_names` |
| S3 | Réponse d'examen : `int(request.POST["question"])` et `pk__in` sur des valeurs brutes, erreur 500 sur une charge du type `1 OR 1=1` | Injection SQL (tentative) / robustesse | Validation stricte en UUID avant toute requête : 400 si invalide, 404 si la question n'est pas dans la tentative | `test_sql_injection_in_answer_fields_is_a_clean_400`, `test_answer_without_question_or_with_a_foreign_question_is_refused` |
| S4 | Image de question en SVG acceptée sans contrôle : un `<script>` s'exécuterait dans l'origine du site à l'ouverture du fichier | XSS stocké | `config.uploads.validate_inert_svg` refuse script, `on…=`, `javascript:`/`data:`, `foreignObject`, DOCTYPE/ENTITY | `test_question_image_rejects_active_svg`, `test_question_image_accepts_a_plain_svg` |
| S5 | Aucune politique CSP ; script en ligne dans le sommaire | XSS (défense en profondeur) | `config.middleware.ContentSecurityPolicyMiddleware` (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`…) ; script du sommaire déplacé dans `static/acad/js/outline.js` | `test_content_security_policy_blocks_inline_and_foreign_scripts`, `test_no_inline_script_in_rendered_pages` |
| S6 | Export CSV : un nom commençant par `=`, `+`, `-`, `@` devient une formule dans Excel | Injection CSV | Préfixe `'` sur ces cellules (`progress.views._csv_cell`) | `test_csv_export_neutralises_formula_injection` |
| S7 | `GET /quiz/<id>/` créait une tentative : action déclenchable par un lien ou une image tiers | CSRF | `require_POST` + bouton dans un formulaire avec jeton | `test_starting_a_quiz_requires_post`, `test_state_changing_requests_without_csrf_token_are_refused` |
| S8 | Connexion (site et admin) sans limite d'essais | Session / force brute | `accounts.throttling` : 5 échecs en 15 min verrouillent l'identifiant ; message identique que le compte existe ou non ; pas de comptage par IP (proxy PythonAnywhere commun) | `test_brute_force_locks_the_account_after_five_failures`, `test_lockout_does_not_reveal_whether_the_username_exists`, `test_lockout_expires_and_success_resets_the_counter`, `test_lockout_of_one_user_does_not_block_another` |
| S9 | Session de 2 semaines sur des téléphones partagés ; cookie CSRF lisible en JavaScript | Session | `SESSION_COOKIE_AGE` = 8 h, `HttpOnly` sur les deux cookies, `SameSite=Lax` ; en production préfixe `__Host-`, HSTS 1 an avec sous-domaines | `test_session_and_csrf_cookies_are_hardened`, `test_production_cookies_use_host_prefixes` |
| S10 | Production démarrable avec la clé secrète de développement (cookies de session forgeables) | Session | Refus de démarrer si `DEBUG=0` et clé absente, connue ou faible (< 50 caractères ou < 5 caractères distincts) | `test_production_refuses_to_start_without_a_strong_secret_key` |
| S11 | (2026-10-21, Partie 2) Import : `![x](img/../questions.json)` ou `img/../../../formation.json` accepté ; la section pointait vers les bonnes réponses, et une image matricielle passait | Traversée de chemin / déduction | `courses.importer.IMAGE_NAME` : un seul nom de fichier `.svg` ou `.webp` directement dans `img/`, sinon `ContentError` (import annulé) | `test_import_refuses_course_images_outside_img_or_of_another_type` |
| S12 | (2026-10-21) Rendu : un `src="cours/…"` absent du manifeste (texte édité dans l'admin) faisait lever `static()` : section en erreur 500 en production | Déni de service | `courses.rendering._static_src` : source retirée, texte alternatif conservé ; réécriture testée contre la réouverture d'un XSS | `test_unknown_course_image_does_not_break_the_section_page`, `test_course_image_rewriting_never_reopens_an_xss` |
| S13 | (2026-10-21) `ContentImagesFinder` publiait tout SVG d'un dossier `img/`, même jamais importé donc jamais contrôlé ; PythonAnywhere sert les statiques sans l'en-tête CSP | XSS stocké | Le finder (`find` et `list`, donc `collectstatic`) exige `validate_inert_svg` ; chemins absolus, lecteurs Windows et séparateurs mélangés refusés | `test_course_static_files_never_serve_an_active_svg`, `test_course_static_files_refuse_absolute_and_mixed_separator_paths` |
| S14 | (2026-10-21) Nouvelles pages d'erreur 400/403/404/500 : risque de refléter l'URL demandée ou le message d'exception | XSS réfléchi / fuite d'information | Gabarits sans variable d'exception ni chemin ; l'URL n'apparaît qu'échappée (champ `next` du sélecteur de langue) | `test_error_pages_never_reflect_the_requested_url_unescaped`, `test_server_error_page_never_reveals_the_exception` |

**Vérifié sans faille (tests de non-régression)** : injection SQL dans les URL (rejetée par le routeur) et dans la connexion (ORM paramétré, aucun `raw()`, `extra()` ni `cursor` dans le code) ; Markdown nettoyé par bleach (script, `onerror`, `javascript:`, iframe, `style`) ; titres, énoncés et choix échappés par les gabarits ; cloisonnement par promotion et propriétaire de la tentative, même avec un UUID connu ; rotation de la clé de session à la connexion ; déconnexion en POST qui détruit la session ; changement de mot de passe qui invalide les autres sessions ; `check --deploy` sans avertissement (le seul avertissement désactivé, `security.W021` préchargement HSTS, est impossible pour un sous-domaine de pythonanywhere.com).

**Limites connues** : les médias sont servis par PythonAnywhere sans contrôle d'accès (l'UUID du nom rend l'adresse impossible à deviner, mais un lien partagé reste valable) ; l'admin garde des clés entières dans ses URL (réservé au personnel authentifié).

## Definition of Done (critères stricts)
Une user story ou une fonctionnalité n'est **terminée** que si **tous** les points sont vrais :
1. **Tests** : la suite (`pytest`, 315 tests au 2026-10-21) passe à 100 %. Toute règle métier touchée a ses tests : notation partielle et plancher 0, seuil de 70 %, 3 tentatives et meilleure note, deadline et envoi automatique, reprise de tentative, déblocage de l'examen, cloisonnement formateur ↔ promotion, refus de publication sans double relecture, repli de langue.
2. **E2E** : le scénario Playwright de la story passe en local sur un viewport mobile (360×800) : connexion → lecture → quiz → examen avec rechargement en cours → résultat → bascule /fr/ ↔ /en/.
3. **Bilingue** : toute chaîne d'interface est dans les fichiers `.po`, fr et en, avec `compilemessages` sans erreur ; aucune chaîne en dur.
4. **Sécurité** : `python manage.py check --deploy --fail-level WARNING` passe avec les réglages de production ; aucun secret dans le diff (vérifié par une recherche) ; contrôle d'accès testé (un apprenant ne voit pas une autre promotion ; un formateur ne voit que ses promotions) ; les tests d'intrusion `config/tests/test_intrusion.py` passent (injection SQL, XSS, CSRF, session, force brute, énumération). Toute nouvelle vue ou tout nouveau formulaire : objets désignés par leur `public_id` UUID, jamais par la clé entière ; entrées validées avant la base (400 si invalides) ; action qui modifie l'état en POST avec jeton CSRF ; aucun `|safe` hors HTML nettoyé par bleach ; aucun script en ligne ni gestionnaire `on…=` (CSP) ; tout téléversement avec un nom aléatoire et, s'il s'agit de SVG, `validate_inert_svg` ; toute image de cours : un nom de fichier `.svg`/`.webp` directement dans `img/`, inerte, servie seulement par `ContentImagesFinder` ; toute page d'erreur sans chemin ni message d'exception ; toute cellule d'export CSV passée par `_csv_cell`. Un test d'intrusion accompagne chaque nouvelle surface d'attaque.
   - **Conformité constatée le 2026-10-17** (audit S1 à S10 ci-dessus) : 234 tests au vert dont 62 tests d'intrusion ; `check --deploy` sans avertissement ; migrations UUID appliquées sur la base de développement réelle (une valeur distincte par ligne, aucune valeur nulle) et sur base vide ; `import_content` exécuté deux fois sans doublon ; scénario Playwright 360×800 (connexion, module, quiz lancé en POST, sauvegarde HTMX, rechargement, résultat, bascule /en/) sans aucune violation CSP.
   - **Conformité constatée le 2026-10-21** (audit S11 à S14, code de la Partie 2 et des pages d'erreur) : 302 tests au vert dont 79 cas d'intrusion, chacun vu en échec avant son correctif (le cas « XSS par l'URL d'image » s'est révélé sans faille : l'attaque reste encodée dans l'URL) ; aucune requête SQL brute ajoutée (ORM seul, vérifié par le test existant) ; seul `|safe` du projet = HTML passé par bleach ; `check --deploy` sans avertissement ; `import_content` réel exécuté deux fois (31 sections, 73 questions, aucune image refusée) ; transactions SQLite `IMMEDIATE` (aucune réponse perdue sur sauvegardes simultanées) ; sessions ouvertes pour l'audit visuel supprimées de la base de développement.
5. **Budget** : le poids du projet + venv reste < 150 Mo (`du -sh`) ; la page touchée transfère < 200 Ko (mesure Playwright).
6. **Données** : les migrations sont créées et appliquées sur une base vide ; `import_content` est idempotent (deux exécutions, aucun doublon).
7. **Interface** : relue avec la grille design-taste-frontend ; aucun texte ni asset NetAcad ; capture mobile jointe à la PR.
8. **Contenu** (stories de contenu) : sections transcrites fidèles aux photos (relecture humaine cochée), questions au statut `draft` jusqu'à validation du formateur, sauf pour la Partie 2 (Q23, Q24) : questions publiées par `import_content --publish`.
9. **Déploiement** (jalon de release) : `deploy.sh` exécuté sur PythonAnywhere ; /fr/ et /en/ répondent 200 ; l'admin est accessible ; une sauvegarde a été produite dans `DJANGO_BACKUP_DIR`.
10. **Documentation** : AGENTS.md est mis à jour si une décision change ; pas de TODO non suivi dans le code livré.
11. **Schémas** (Partie 2, vérifiés par des tests sauf la capture) : toute image citée dans un `.md` existe ; chaque SVG passe `validate_inert_svg` et pèse ≤ 6 Ko ; texte alternatif non vide en fr et en en ; tout `.fr.svg` a son `.en.svg` ; aucun fichier matriciel (jpg, png, webp) sous `content/froid/p2/` ; capture à 360 px en clair et en sombre pour au moins un schéma par module.
12. **Provenance** : un test vérifie que toute section `supplement` affiche le badge « Complément » en fr et en en ; chaque entrée de `CORRECTIONS.md` donne la page, le texte d'origine, la correction et la justification ; aucune note de correction dans le texte servi à l'apprenant.
13. **Banque de la Partie 2** (tests) : au moins 8 questions de quiz et 8 d'examen par module, toutes publiables ; chaque section `content` a au moins une question ; l'examen tire exactement 40 questions, 5 par module ; deux tirages successifs diffèrent.
14. **Licences** : `git ls-files` ne contient ni la NF C 15-100, ni une photo du support, ni une image tirée d'internet ; la terminologie anglaise suit le glossaire de la Partie 2 (relecture).
15. **Jalons** (Q30) : chaque jalon J1 à J4 se termine par un arrêt pour validation ; J1 fait valider le style des SVG avant toute production en série.
