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
| Q17 | Combien de modules en Partie 2 (le sommaire du support en annonce 7, le corps en contient 8) ? | 8 modules : 1 Notions de base en électricité, appareillages et outils de l'électricien ; 2 Projet de création d'une installation électrique d'une nouvelle résidence ; 3 Montage simple allumage ; 4 Montage double allumage ; 5 Montage va-et-vient ; 6 Montage télérupteur ; 7 Montage d'une minuterie ; 8 Montage et réglage d'une horloge. Interrupteur crépusculaire et détecteur de mouvement d'abord hors v1 (aucune page dans le support) ; **révisé le 2026-10-29 (Q31)** : pages 39 à 44 reçues, ils forment le module 9 |
| Q18 | Que faire du PDF NF C 15-100 (norme AFNOR, 8 Mo) ? | Source de travail seulement : règles reformulées et citées « NF C 15-100 » ; le PDF n'est ni dans le dépôt ni sur le serveur |
| Q19 | Comment afficher les schémas (architectural, développé, unifilaire, symboles) ? | Schémas redessinés en SVG (2 à 6 Ko, `validate_inert_svg`) ; la règle « jamais de SVG dessiné à la main » ne vise que les icônes d'interface |
| Q20 | Où mettre les images de cours, et comment le Markdown les appelle-t-il ? | Fichiers statiques versionnés à côté du texte (`content/froid/p2/mN/img/`) ; chemin relatif dans le Markdown, réécrit en URL `{% static %}` (empreinte, gzip) au rendu ; SVG sur fond clair fixe, lisible en mode sombre |
| Q21 | Le module 2 (2 pages imprimées et 3 photos du tableau noir) est trop mince pour 8 h : que fait-on ? | On transcrit, puis on développe chaque étape d'après la NF C 15-100, sur le cas du tableau noir ; plan de maison redessiné en SVG (pas l'image d'internet) ; valeurs à la craie recoupées avec la norme |
| Q22 | Comment marquer le contenu rédigé par Claude ? | Champ `Section.is_supplement` (`"supplement": true` dans le manifeste), badge « Complément » dans le sommaire et en tête de section, filtre dans l'admin ; une section est soit transcrite, soit rédigée. Les compléments sont publiés sans validation préalable du formateur |
| Q23 | Questions de la Partie 2 : brouillon jusqu'à relecture (Q11b) ou publiées d'office ? | Publiées d'office (quiz et examen), `reviewed` fr/en à `true` dans `questions.json` ; dérogation à Q11b approuvée par le propriétaire le 2026-10-20 |
| Q24 | Par quel mécanisme publier d'office, et jusqu'où va la dérogation ? | Option `import_content --publish` : appelle `Question.publish()` sur les questions relues fr et en, et liste les refus ; sans l'option, rien ne change. Dérogation limitée à la Partie 2 ; Q11b reste la règle par défaut |
| Q25 | Combien de questions, et quel examen pour 8 modules ? | Banque de 8 questions de quiz et 8 d'examen par module (au moins 1 par section) ; tirage de 5 par module, soit 40 questions en 60 min ; `"exam": {"questions_per_module": 5}` dans `formation.json`, appliqué par l'import ; 70 %, 3 tentatives et mélange inchangés |
| Q26 | Que faire des images copiées d'internet (schéma de frigo légendé en indonésien p. 35, maison filigranée, photos de produits) ? | Aucune photo en Partie 2 : schémas tiers redessinés en SVG simplifié (seulement l'utile), maison remplacée par le plan SVG, photos de produits remplacées par des tableaux (appareil, usage, plaque), plus un SVG quand la forme compte |
| Q27 | Quel anglais pour l'électricité ? | Vocabulaire IEC et anglais britannique (two-way switching, intermediate switching, impulse relay, staircase timer, RCD, MCB, time switch) ; NF C 15-100 citée (« IEC 60364 » à la 1re mention) ; Eneo et couleurs de fils inchangés ; terme français entre parenthèses à la 1re occurrence ; glossaire fr ↔ en au module 1 de la Partie 2 |
| Q28 | En quelle langue écrire dans les SVG ? | Repères normalisés neutres (L, N, PE, F1, S1, K1, ①…), légende et `alt` traduits dans le Markdown ; `.fr.svg` et `.en.svg` seulement pour les schémas dont le texte est le contenu (synopsis, plan) ; un test vérifie que tout `.fr.svg` a son `.en.svg` |
| Q29 | Que faire quand le support se trompe techniquement ? | Correction dans le texte, sans note pour l'apprenant ; chaque correction de fond (page, texte d'origine, correction, justification) est consignée dans `content/froid/p2/CORRECTIONS.md` |
| Q30 | Ordre des livraisons et points de validation ? | J0 grill consigné → J1 code et tests, plus une section d'essai (module 3) pour valider le style des SVG → J2 modules 1 à 4 → J3 modules 5 à 8 → J4 publication, Playwright 360×800, Definition of Done, déploiement sur demande ; arrêt pour validation après chaque jalon ; commit sur `develop`, sans push sans accord |
| Q31 | Que faire des pages 39 à 44 du support (`reference/cours/02_partie2/module9`), arrivées après la Partie 2 ? | 9e module de la Partie 2, `p2/m9`, 8 h (durée absente du support, reprise des modules 1 à 8) : « Câblage et réglage de l'interrupteur crépusculaire et du capteur de mouvement » / « Wiring and setting the twilight switch and the motion detector » ; Q17 et le hors scope sont révisés |
| Q32 | Découpage du module 9 ? | 4 sections : 1 Interrupteur crépusculaire (partie I du support) ; 2 Capteur de mouvement (II) ; 3 Comparaison, association et pannes (III, IV, V et conclusion) ; 4 Activités pratiques (TAF), absentes du support, rédigées sur le modèle des modules 3 à 8 (section `practical`, sans badge « Complément », comme au module 8) |
| Q33 | Quels schémas pour le module 9 ? | 4 SVG redessinés à repères neutres (L, N, PE, B1, K1, E1, S1) : crépusculaire en direct, crépusculaire commandant un relais ou contacteur (« Commande d'un éclairage extérieur », p. 41), capteur en direct, capteur avec interrupteur de forçage en parallèle (p. 43) ; pas de `.fr/.en.svg` ; ni les images d'internet des p. 41 et 43 (filigranes), ni le schéma de principe en texte brouillé ; pas de schéma d'association (le support déconseille d'improviser un montage en série) |
| Q34 | Corrections de fond du module 9 ? | Une entrée dans `CORRECTIONS.md` : borne PE « si nécessaire » → conducteur de protection présent à chaque point d'éclairage (NF C 15-100), raccordé au luminaire de classe I ; sans journal : coquille « 5ardin », procédures renumérotées à partir de 1 ; vérification d'absence de tension (VAT) ajoutée au raccordement du crépusculaire |
| Q35 | Questions du module 9 ? | 8 de quiz et 8 d'examen, au moins 1 par section de cours, `reviewed` fr/en à `true`, publiées par `import_content --publish` : la dérogation Q23/Q24 s'étend au module 9 |
| Q36 | Glossaire ? | Ajouts au glossaire du module 1 de la Partie 2 : interrupteur crépusculaire ↔ twilight switch, capteur de mouvement ↔ motion detector (PIR), cellule photoélectrique ↔ photocell, temporisation ↔ time delay, seuil de luminosité ↔ light threshold (lux) |
| Q37 | Documentation ? | AGENTS.md (source de vérité) et CLAUDE.md mis à jour dans le même commit que le contenu |
| Q38 | Taille de l'examen de la Partie 2 avec 9 modules ? | 9 × 5 = 45 questions en 60 min ; `questions_per_module` reste à 5 ; 70 %, 3 tentatives et mélange inchangés |
| Q39 | Apprenants ayant déjà terminé la Partie 2 ? | Le module 9 apparaît à faire (progression recalculée, « Continuer » y mène, nouvelle tentative d'examen après lui) ; tentatives envoyées et meilleure note conservées ; aucun code spécifique |
| Q40 | Jalons du module 9 ? | Un seul jalon (contenu, 4 SVG, 16 questions, glossaire, journal, tests à 9 modules et 45 questions, Playwright 360 px clair et sombre, docs), puis commit sur `develop`, push et déploiement sur PythonAnywhere avec `import_content --publish`, à la demande du propriétaire (2026-10-29) |
| Q41 | Structure de la Partie 3 (`reference/cours/03_partie3`, pages 2 à 31) ? | Partie `p3` « Les bases de l'électricité industrielle » / « Fundamentals of industrial electricity », 6 modules `p3/m1` à `p3/m6` numérotés 1 à 6 (numérotation du support 15, 16i, 16, 17, 18, 19 abandonnée) : 1 Les moteurs électriques (8 h) ; 2 Appareillages électriques industriels (4 h) ; 3 Démarrage direct des moteurs asynchrones triphasés, un sens de marche (12 h) ; 4 Démarrage semi-automatique, deux sens de rotation (16 h) ; 5 Démarrage étoile-triangle (16 h) ; 6 Démarrage fractionné (part winding) (8 h, durée absente du support, comme au module 9 de la Partie 2) ; 64 h au total (2026-11-03) |
| Q42 | Images de la Partie 3 ? | Q26 étendu : aucune photo ; schémas (puissance, commande, couplages, barrettes, plaques à bornes, symboles) redessinés en SVG à repères IEC neutres (L1 à L3, N, PE, Q, KM, F, S, M1, U1/U2…), 420 de large au plus ; courbe Id/In (p. 24) en SVG ; photos de produits remplacées par des tableaux ; marques retirées (Leroy-Somer → « Plaque A » et « Plaque B » en tableau ; Kriwan → « module de protection à sondes PTC » ; Schneider, Legrand) ; tableau des appareillages (p. 13-14) en tableau texte (famille, fonction, usage, appareil) + 1 ou 2 planches SVG de symboles |
| Q43 | Publication des questions de la Partie 3 ? | La dérogation Q23/Q24 s'étend à la Partie 3 : `reviewed` fr/en à `true`, publiées par `import_content --publish` |
| Q44 | Banque et examen de la Partie 3 ? | 8 questions de quiz et 8 d'examen par module (≥ 1 par section `content`), soit 96 ; examen de 30 questions (5 par module) en 60 min, 70 %, 3 tentatives, mélange ; l'exercice des plaques A et B (p. 28) alimente quiz et examen |
| Q45 | Corrections de fond de la Partie 3 ? | Journal `content/froid/p3/CORRECTIONS.md` (Q29 étendu) : p. 4 différence synchrone/asynchrone au **rotor** (et non au stator) ; p. 16 400/790 V → 400/690 V (et 380 → 400 V sur le schéma triangle) ; p. 18 W1-W3 → W1-W2 ; p. 11 octo-coupleur → opto-coupleur, relais à bobine et contacts électromécanique (et non électronique) ; p. 10 et 12 définitions des relais magnétique et thermique réécrites ; p. 30-31 F7/F8 → F1/F2 ; plus Q46 et les TAF rédigées (Q48). Coquilles corrigées sans journal |
| Q46 | Contacteurs du démarrage étoile-triangle (p. 25 à 27), nommés différemment en puissance et en commande ? | Harmonisés sur KM1 ligne, KM2 étoile, KM3 triangle (schéma de puissance) ; schéma de commande et texte « 1er temps / 2e temps » réécrits (bloc temporisé travail sur KM1, verrouillages électrique et mécanique KM2 ↔ KM3) ; correction journalisée |
| Q47 | Tensions du réseau (220/380, 380/660, 230/400, 400/690 V mêlées) ? | Exemples du support gardés, fautes corrigées ; à la 1re mention : « 220/380 V et 380/660 V correspondent aux tensions normalisées 230/400 V et 400/690 V (IEC 60038) » ; Eneo cité tel quel |
| Q48 | Contenu absent ou illisible ? | Une section TAF (`practical`, sans badge « Complément ») par module, rédigée sur le modèle des TAF du support (matériel, séquence, barème 15/60/10/15) quand elle manque (modules 2, 4, 6), chaque TAF rédigée journalisée ; schéma de commande avec butées de fin de course (p. 20, en partie effacé) reconstitué d'après le schéma lisible et la pratique courante (S3, S4 à ouverture en série avec chaque bobine) |
| Q49 | Glossaire et anglais de la Partie 3 ? | Glossaire fr ↔ en propre (section « Complément » en tête de `p3/m1`) ; Q27 étendu : direct-on-line (DOL) starting, star-delta, reversing starter, part-winding starting, contactor, thermal overload relay, fuse switch-disconnector (isolator), on-delay / off-delay timer block, limit switch, hold-in (self-holding) contact, electrical / mechanical interlock, squirrel cage, rating plate, terminal board, phase / line voltage ; terme français entre parenthèses à la 1re occurrence |
| Q50 | Documentation ? | AGENTS.md et CLAUDE.md mis à jour dans le même commit que le contenu ; hors scope « Parties 3 et suivantes » → « Parties 4 et suivantes » |
| Q51 | Découpage en sections ? | 24 sections : **m1** 01 Glossaire (complément), 02 Définition, types et constitution, 03 Principe et couplage, 04 Plaque signalétique, 05 TAF ; **m2** 01 Isolement, 02 Protection, 03 Commande (contacteur, relais électromécaniques et statiques), 04 Tableau récapitulatif, 05 TAF ; **m3** 01 Prérequis, 02 Démarrage direct, 03 TAF ; **m4** 01 Schémas et verrouillages, 02 Butées de fin de course et utilisations, 03 TAF ; **m5** 01 Prérequis (couplages, relais temporisé), 02 Principe, 03 Schémas et fonctionnement, 04 Exercice des plaques A et B, 05 TAF ; **m6** 01 Principe et rôle, 02 Repérage et schémas, 03 TAF |
| Q52 | Quels schémas ? | ≈ 19 SVG : m1 coupe simplifiée du moteur (vue éclatée → tableau des pièces), barrettes étoile/triangle ; m2 2 planches de symboles, principe du différentiel ; m3 couplages, puissance et commande du démarrage direct ; m4 puissance, commande, commande avec fins de course ; m5 symboles du relais temporisé, courbe Id/In, puissance, commande ; m6 plaques à bornes E à H, puissance et commande. Commande verticale entre deux rails (L1 ou Ph en haut, N en bas), puissance et commande dans deux SVG séparés, 420 de large au plus, `.fr/.en.svg` seulement pour la courbe Id/In |
| Q53 | Jalons de la Partie 3 ? | J1 module 3 (essai du style des schémas industriels) puis arrêt pour validation ; J2 modules 1, 2, 4, 5, 6, 96 questions, glossaire, journal ; J3 tests, Playwright 360 px clair et sombre, docs, commit sur `develop` ; push et déploiement (`deploy.sh` puis `import_content … --publish`) seulement sur demande |
| Q54 | Tests et Definition of Done ? | `courses/tests/test_part_three.py` (6 titres et durées, une TAF par module, ≥ 1 question par section `content`, 8 + 8 questions publiables par module, examen de 30 questions et deux tirages différents, glossaire Q49, format de `p3/CORRECTIONS.md`, SVG inertes ≤ 6 Ko, aucun fichier matriciel sous `p3/`, aucune marque dans le contenu servi) ; garde-fous de `test_content_files.py` étendus à la Partie 3 ; point 17 « Partie 3 » dans la Definition of Done |

## GOALS

### 1. Objectifs fonctionnels prioritaires
1. **Lecteur de cours** : Formation → Partie → Module → Section, avec un sommaire repliable et une barre de progression par module et par partie.
2. **Quiz de module** : entraînement illimité, correction et explication affichées après envoi.
3. **Examen de partie** : banque séparée, 70 % pour réussir, 3 tentatives, 60 min chronométrées côté serveur, reprise après coupure, envoi automatique.
4. **Progression** : navigation libre ; l'examen se débloque quand tous les modules de la partie sont terminés.
5. **Comptes et promotions** : créés par l'admin (import CSV) ; trois rôles ; cloisonnement par promotion.
6. **Tableau formateur** : apprenants × modules (progression, meilleur score d'examen) et export CSV.
7. **Workflow éditorial** : questions brouillon → publiées par un formateur, seulement quand fr et en sont relus. Dérogation pour la Partie 2 : questions approuvées d'avance par le propriétaire et publiées par `import_content --publish` (Q23, Q24), dérogation étendue à la Partie 3 (Q43).
8. **Contenu v1, Partie 1** : 6 modules transcrits et bilingues, avec ≈ 12 questions de quiz et ≈ 10 questions d'examen par module.
9. **Contenu, Partie 2 « Les bases de l'électricité domestique »** : 9 modules (Q17, Q31) transcrits et bilingues, chacun avec sa section d'activités pratiques (TAF) ; module 2 développé d'après la NF C 15-100 sur le cas du tableau noir (Q21) ; module 9 « Câblage et réglage de l'interrupteur crépusculaire et du capteur de mouvement » en 4 sections (Q32) ; banque de 8 questions de quiz et 8 d'examen par module, examen de 45 questions tirées (5 par module) en 60 min (Q25, Q38) ; glossaire fr ↔ en (Q27, Q36).
10. **Contenu, Partie 3 « Les bases de l'électricité industrielle »** (Q41) : 6 modules transcrits et bilingues (moteurs électriques 8 h, appareillages industriels 4 h, démarrage direct un sens 12 h, deux sens de rotation 16 h, étoile-triangle 16 h, démarrage fractionné 8 h), 24 sections dont une activité pratique (TAF) par module, rédigée quand le support n'en a pas (Q48, Q51) ; banque de 8 questions de quiz et 8 d'examen par module (96), examen de 30 questions tirées (5 par module) en 60 min, exercice de lecture des plaques A et B (Q44) ; glossaire fr ↔ en propre en tête du module 1 (Q49).
11. **Schémas de cours** : schémas électriques redessinés en SVG, aucune photo en Parties 2 et 3 ; repères normalisés dans le dessin, légende et texte alternatif traduits (Q19, Q26, Q28) ; module 9 de la Partie 2 : 4 schémas de principe (crépusculaire et capteur, en direct ou avec relais / forçage) (Q33) ; Partie 3 : ≈ 19 schémas industriels (couplages, plaques à bornes, symboles, circuits de puissance et de commande du démarrage direct, de l'inverseur, de l'étoile-triangle et du démarrage fractionné, courbe Id/In) (Q42, Q52).
12. **Provenance visible** : toute section rédigée par Claude (et non transcrite) porte le badge « Complément » et se filtre dans l'admin ; les corrections de fond du support sont journalisées dans `content/froid/p2/CORRECTIONS.md` et `content/froid/p3/CORRECTIONS.md` (Q22, Q29, Q45), dont l'harmonisation des contacteurs de l'étoile-triangle (KM1 ligne, KM2 étoile, KM3 triangle) (Q46).
13. **Interface** : bilingue /fr/ et /en/, mobile d'abord, patterns NetAcad, charte Ventisax.

### 2. Contraintes techniques
- Python le plus récent proposé par PythonAnywhere ; **Django 5.2 LTS** ; **SQLite** (un seul fichier, sauvegardé chaque jour).
- Rendu serveur (gabarits Django) + **HTMX vendoré** ; aucun CDN, aucun Node, aucune SPA.
- Dépendances autorisées : `django`, `django-modeltranslation`, `markdown`, `bleach`. Toute autre dépendance demande un accord explicite.
- **Disque < 150 Mo** (code + venv + base + médias) sur un quota de 512 Mo ; photos en WebP, schémas en SVG ; **pages < 200 Ko** à la première visite.
- Images de cours : fichiers statiques versionnés dans `content/<formation>/<partie>/<module>/img/`, appelés en chemin relatif dans le Markdown et réécrits en URL `{% static %}` au rendu ; SVG de 2 à 6 Ko, inertes (`validate_inert_svg`), sur fond clair fixe ; `.fr.svg` / `.en.svg` seulement pour les schémas dont le texte est le contenu (Q20, Q28).
- Manifeste `formation.json` : `"supplement": true` par section et `"exam": {"questions_per_module": N}` par partie, appliqués par l'import idempotent (Q22, Q25).
- Normes : la NF C 15-100 sert de source de travail, reformulée et citée, jamais versionnée ni servie (Q18) ; anglais technique IEC / britannique, contexte camerounais conservé (Eneo, couleurs de fils du support) (Q27, Q49) ; tensions du support gardées, avec la correspondance IEC 60038 (230/400 V, 400/690 V) à la 1re mention (Q47).
- Schémas industriels (Partie 3) : repères IEC neutres (L1 à L3, N, PE, Q, KM, F, S, M1, U1/U2…), circuit de commande vertical entre deux rails, puissance et commande dans deux SVG séparés, 420 de large au plus ; `.fr/.en.svg` seulement pour la courbe Id/In (Q42, Q52).
- Jalons de la Partie 3 (Q53) : J1 module 3 puis arrêt pour validation du style des schémas ; J2 modules 1, 2, 4, 5, 6 ; J3 tests (`courses/tests/test_part_three.py`, Q54), Playwright 360 px, docs, commit sur `develop` ; push et déploiement seulement sur demande.
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
- Parties 4 et suivantes de la formation.
- Schéma de câblage associant interrupteur crépusculaire et capteur de mouvement (décrit en texte seulement, le support déconseillant d'improviser un montage en série) (Q33).
- Toute reprise de textes, questions, logos ou assets de NetAcad/Cisco.
- Photos ou images tirées d'internet ou de catalogues dans le contenu des Parties 2 et 3 ; republication du texte ou du PDF de la NF C 15-100.
- Noms et logos de fabricants dans le contenu de la Partie 3 (Leroy-Somer, Kriwan, Schneider, Legrand) : plaques et appareils présentés de façon générique (Q42).
- Vue éclatée dessinée du moteur (remplacée par un tableau des pièces) (Q52).
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
- US-21 : En tant qu'apprenant, je suis les 9 modules de la Partie 2 dans le même lecteur que la Partie 1, avec la même progression et le même déblocage de l'examen.
- US-22 : En tant qu'apprenant, je lis chaque schéma (architectural, développé, unifilaire, symboles) sur un téléphone de 360 px, en mode clair comme sombre, avec une légende et un texte alternatif dans ma langue.
- US-23 : En tant qu'apprenant, je reconnais au badge « Complément » les sections rédigées en plus du support imprimé.
- US-24 : En tant qu'apprenant anglophone, je lis le vocabulaire IEC avec le terme français entre parenthèses à la 1re occurrence, et je consulte un glossaire fr ↔ en au début du module 1 de la Partie 2.
- US-25 : En tant qu'apprenant, je consulte l'activité pratique (TAF) de chaque module : consignes, matériel et outillage, séquence de réalisation, temps estimé, éléments d'évaluation.
- US-26 : En tant qu'apprenant, je passe l'examen de la Partie 2 : 45 questions (5 par module, 9 modules) en 60 min, avec un tirage différent à chaque tentative (Q38).

*Formateur*
- US-27 : En tant que formateur, je filtre dans l'admin les sections « Complément » (lecture seule) pour les relire après publication, et je consulte `content/froid/p2/CORRECTIONS.md` pour voir chaque correction de fond apportée au support.

*Admin*
- US-28 : En tant qu'admin, je lance `import_content … --publish` : les questions relues fr et en sont publiées, les refus sont listés avec leur raison ; sans l'option, rien n'est publié.
- US-29 : En tant qu'admin, le nombre de questions d'examen par module est lu dans `formation.json` (`exam.questions_per_module`) et réappliqué à chaque import, sans réglage à la main sur le serveur.

**Partie 2, module 9 : interrupteur crépusculaire et capteur de mouvement (2026-10-29)**
*Apprenant*
- US-30 : En tant qu'apprenant, je suis le module 9 « Câblage et réglage de l'interrupteur crépusculaire et du capteur de mouvement » en 4 sections (crépusculaire, capteur, comparaison-association-pannes, TAF), en fr et en en (Q31, Q32).
- US-31 : En tant qu'apprenant, je lis sur un téléphone de 360 px, en clair comme en sombre, les 4 schémas de principe du module 9 (crépusculaire en direct ou avec relais/contacteur, capteur en direct ou avec interrupteur de forçage), avec repères L, N, PE, B1, K1, E1, S1 et une légende traduite (Q33).
- US-32 : En tant qu'apprenant, je retrouve les réglages (seuil de luminosité, temporisation, TIME, LUX, SENS), la procédure de réglage numérotée et le tableau des pannes courantes ; le raccordement commence toujours par la coupure et la vérification d'absence de tension (Q34).
- US-33 : En tant qu'apprenant qui avait déjà terminé la Partie 2, je vois le module 9 à faire et « Continuer » m'y mène ; mes tentatives d'examen et ma meilleure note restent acquises (Q39).
- US-34 : En tant qu'apprenant anglophone, je trouve au glossaire du module 1 de la Partie 2 twilight switch, motion detector (PIR), photocell, time delay et light threshold (lux), avec le terme français (Q36).

*Formateur*
- US-35 : En tant que formateur, je vois la colonne « 2.9 » dans mon tableau apprenants × modules et dans l'export CSV, et je lis dans `CORRECTIONS.md` la correction du conducteur de protection (PE) apportée au support (Q34).

*Admin*
- US-36 : En tant qu'admin, un `deploy.sh` suivi de `import_content content/froid/formation.json --publish` ajoute le module 9 et publie ses 16 questions sans autre manipulation (Q35, Q40).

**Partie 3 : les bases de l'électricité industrielle (2026-11-04)**
*Apprenant*
- US-37 : En tant qu'apprenant, je vois sur « Mes cours » la Partie 3 « Les bases de l'électricité industrielle » avec ses 6 modules (64 h) et son bouton « Continuer », et je la suis dans le même lecteur, avec la même progression, que les Parties 1 et 2 (Q41).
- US-38 : En tant qu'apprenant, j'apprends à décrire un moteur asynchrone triphasé (stator, rotor à cage, champ tournant), à choisir son couplage étoile ou triangle d'après la tension du réseau et à décoder sa plaque signalétique (module 1, Q51).
- US-39 : En tant qu'apprenant, je reconnais les appareillages industriels (sectionneur, interrupteur, fusible, disjoncteurs, contacteur, relais thermique, magnétique, magnétothermique, temporisé, électromécanique et statique) par leur rôle et leur symbole, dans un tableau récapitulatif lisible à 360 px (module 2, Q42, Q51).
- US-40 : En tant qu'apprenant, je lis les schémas de puissance et de commande du démarrage direct, de l'inversion du sens de rotation (avec ou sans butées de fin de course), du démarrage étoile-triangle et du démarrage fractionné, sur un téléphone de 360 px en clair comme en sombre, avec repères IEC (L1 à L3, N, PE, Q, KM, F, S, M1, U1/U2) et légende traduite (modules 3 à 6, Q42, Q52).
- US-41 : En tant qu'apprenant, je comprends le fonctionnement de chaque démarrage (auto-maintien, verrouillages électrique et mécanique, temporisation, 1er et 2e temps), ses avantages, ses inconvénients et ses usages, avec des contacteurs nommés de la même façon dans le schéma et dans le texte (KM1 ligne, KM2 étoile, KM3 triangle) (Q46).
- US-42 : En tant qu'apprenant, je m'exerce sur les plaques A et B : je décide si le moteur peut démarrer en étoile, en triangle ou en étoile-triangle sur un réseau donné, et je retrouve ces cas au quiz et à l'examen (Q44).
- US-43 : En tant qu'apprenant, je consulte l'activité pratique (TAF) de chaque module : consignes, matériel par poste, séquence de réalisation, barème (exactitude des fixations 15 %, opérationnalité 60 %, normes et matériel 10 %, compte rendu 15 %) (Q48).
- US-44 : En tant qu'apprenant, je passe l'examen de la Partie 3 quand ses 6 modules sont terminés : 30 questions (5 par module) en 60 min, 70 %, 3 tentatives, un tirage différent à chaque tentative (Q44).
- US-45 : En tant qu'apprenant anglophone, je lis le vocabulaire IEC (direct-on-line starting, star-delta, contactor, thermal overload relay, limit switch, interlock…) avec le terme français entre parenthèses à la 1re occurrence, et je consulte le glossaire fr ↔ en en tête du module 1 de la Partie 3 (Q49).
- US-46 : En tant qu'apprenant, je lis les tensions du support (220/380 V, 380/660 V) avec leur équivalent normalisé (230/400 V, 400/690 V, IEC 60038) à la 1re mention (Q47).

*Formateur*
- US-47 : En tant que formateur, je vois les colonnes « 3.1 » à « 3.6 » et le meilleur score d'examen de la Partie 3 dans mon tableau apprenants × modules et dans l'export CSV.
- US-48 : En tant que formateur, je lis dans `content/froid/p3/CORRECTIONS.md` chaque correction de fond apportée au support (page, texte d'origine, correction, justification), dont l'harmonisation des contacteurs de l'étoile-triangle et les TAF rédigées (Q45, Q46, Q48), et je filtre dans l'admin la section « Complément » du glossaire.

*Admin*
- US-49 : En tant qu'admin, un `deploy.sh` suivi de `import_content content/froid/formation.json --publish` crée la Partie 3, son examen à 5 questions par module et publie ses 96 questions sans autre manipulation (Q43, Q53).

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

Règle dérivée : examen de la Partie 2 = 9 modules × 5 = 45 questions tirées dans une banque de 8 questions d'examen par module (8 × 5 = 40 jusqu'au 2026-10-29).

**Évolutions pour le module 9 (2026-10-29)** : aucune entité ni migration nouvelle ; tout passe par le contenu.
| Entité | Changement | Contraintes |
|---|---|---|
| **Module** | + 1 ligne : Partie `p2`, `order` 9, `dir` `p2/m9`, `duration_hours` 8, title/competence/evaluation_note fr et en | créé par l'import depuis `formation.json` ; son quiz (`Assessment` module_quiz) est créé avec lui |
| **Section** | + 4 lignes : `01-crepusculaire`, `02-detecteur`, `03-comparaison` (`content`), `04-taf` (`practical`) | `is_supplement` faux partout (sections transcrites ; TAF pratique, jamais complément) |
| **Question** / **Choice** | + 16 questions `p2-m9-q01…q16` (8 quiz, 8 exam), `reviewed` fr/en vrai | ≥ 1 question par section `content` ; publiées par `Question.publish()` via `--publish` |
| **Image de cours** | + 4 fichiers `content/froid/p2/m9/img/*.svg` | inertes, ≤ 6 Ko, sans variante `.fr/.en` |
| **Assessment** (part_exam p2) | inchangé (`questions_per_module` = 5) | tirage = 45 questions |
| **SectionView** / **Attempt** | inchangés | progression recalculée : une partie « terminée » redevient incomplète tant que le module 9 ne l'est pas ; tentatives existantes conservées |

**Évolutions pour la Partie 3 (2026-11-04)** : aucune entité ni migration nouvelle ; tout passe par le contenu (`formation.json`, `p3/m1` à `p3/m6`).
| Entité | Changement | Contraintes |
|---|---|---|
| **Partie** | + 1 ligne : slug `p3`, `order` 3, title fr « Les bases de l'électricité industrielle » / en « Fundamentals of industrial electricity », clé `"exam": {"questions_per_module": 5}` | créée par l'import ; son examen (`Assessment` part_exam) est créé avec elle |
| **Module** | + 6 lignes `p3/m1` à `p3/m6`, `order` 1 à 6, `duration_hours` 8, 4, 12, 16, 16, 8 ; title, competence, evaluation_note fr et en | titres de Q41, dans l'ordre ; un quiz (`Assessment` module_quiz) par module |
| **Section** | + 24 lignes (Q51) : 17 `content`, 6 `practical` (une par module), 1 complément (`p3/m1/01-glossaire`, `"supplement": true`) | une TAF n'est jamais un complément, même rédigée (Q48) ; chaque fichier `NN-nom.fr.md` a son `.en.md` |
| **Question** / **Choice** | + 96 questions `p3-mN-q01…q16` (8 quiz, 8 exam par module), `reviewed` fr/en vrai, champ `section` renseigné | ≥ 1 question par section `content` ; publiées par `Question.publish()` via `--publish` (Q43) |
| **Image de cours** | + ≈ 19 fichiers `content/froid/p3/m*/img/*.svg` (Q52) ; `courbe-demarrage.fr.svg` / `.en.svg` seule variante bilingue | inertes, ≤ 6 Ko, 420 de large au plus, aucune marque, aucun fichier matriciel |
| **Assessment** (part_exam p3) | `questions_per_module` = 5, `pass_threshold` 70, `max_attempts` 3, `duration_minutes` 60, `shuffle` vrai | tirage = 6 × 5 = 30 questions dans une banque de 8 questions d'examen par module |
| **SectionView** / **Attempt** | inchangés | la Partie 3 est indépendante : sa progression et son examen ne dépendent pas des Parties 1 et 2 (navigation libre, Q9) |

Règle dérivée : examen de la Partie 3 = 6 modules × 5 = 30 questions tirées ; module terminé = ses sections vues (glossaire et TAF compris) + 1 tentative de quiz envoyée.

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
13. **Module 9 de la Partie 2 (TDD, 2026-10-29)** : transcription des pages 39 à 44 (`reference/cours/02_partie2/module9`) en 4 sections fr/en (`p2/m9`), 16 questions, 4 schémas SVG de 2,8 à 4 Ko (crépusculaire en direct ou avec contacteur, capteur en direct ou avec forçage ; bornes dessinées dans l'ordre L, L', N pour qu'aucun fil ne croise la sortie), 5 termes au glossaire, entrées 15 (PE) et 16 (TAF rédigée) de `CORRECTIONS.md`. Aucune modification du code : import, rendu, progression et tirage sont génériques. Tests : `courses/tests/test_module_nine.py` (une story par test, US-30 à US-36, chacun vu en échec), `test_content_files.py` passé à 9 modules et 45 questions. 339 tests au vert après l'audit visuel.
14. **Partie 3 (TDD, 2026-11-04)** : transcription des pages 2 à 31 (`reference/cours/03_partie3`) en 6 modules et 24 sections fr/en (`p3/m1` à `p3/m6`, dont le glossaire en complément), 96 questions publiées par `--publish`, examen à 5 questions par module (30), 19 SVG inertes de 1,5 à 5,9 Ko en 420 de large au plus (générés en style homogène : contacts, bobines, relais thermiques, moteurs ; commande verticale entre L1 et N), 16 entrées dans `content/froid/p3/CORRECTIONS.md` (dont, au-delà de Q45, les repères KM11/KM12 de la légende du module 4 et le nombre de relais thermiques du module 6). Seule modification du code : l'export CSV formateur titre chaque colonne de module par son repère « partie.module » suivi du titre (« 3.1 Les moteurs électriques »), comme le tableau (US-47). Tests : `courses/tests/test_part_three.py` (18 tests, US-37 à US-49 ; ceux qui portent sur un comportement générique déjà en place, tableau HTML, déblocage de l'examen, import idempotent, repérage des contacteurs, absence de marque, sont des tests de non-régression passés au vert d'emblée), `test_module_nine.py` et `progress/tests/test_trainer.py` adaptés (la colonne 2.9 n'est plus la dernière ; en-tête CSV avec repère). 358 tests au vert ; import réel exécuté deux fois sans doublon ; `check --deploy` sans avertissement.
15. **Figures interactives des sections (skill anatomy, TDD, 2026-11-05)** : quatre relais à bobine et contacts (SPST, SPDT, DPST, DPDT) et relais statique dans `p3/m2/03-commande`, exercice de couplage étoile / triangle dans `p3/m1/03-couplage` et dans `p3/m3/01-prerequis` (« Couplage des moteurs asynchrones triphasés »). Une section appelle une figure par un paragraphe seul `[[figure:nom]]` ; `courses.figures` le remplace, après bleach, par un emplacement léger (titre et bouton « Afficher la figure interactive (N Ko à télécharger) »), seulement si le nom est enregistré dans `FIGURES` (sinon le marqueur disparaît). `static/acad/js/figures.js`, chargé uniquement par une section qui a une figure, télécharge au toucher le fragment SVG (sans script), le kit, les styles et le script de la figure : aucun script en ligne (CSP inchangée), rien de lourd à la première visite (budget de 200 Ko et données mobiles), thème clair ou sombre du site. Les fichiers de `static/acad/figures/` sont produits par `node figures/<nom>/build.mjs` (relais, relais-statique, couplage), qui écrit aussi des pages autonomes fr/en ; le kit du skill anatomy (MIT) est copié dans `figures/_kit`. Tests : `courses/tests/test_figures.py` (marqueur, langue, poids annoncé, nom inconnu ou malveillant, fichiers présents et sans script, publication dans les deux langues, chargeur seulement sur les sections concernées). Vérifié dans Chromium à 360 px, clair et sombre, fr et en : 5 figures chargées, aucune violation CSP, aucun défilement horizontal. 377 tests au vert. **Démarrage fractionné (2026-11-09)** : `fractionne` dans `p3/m6/01-principe` (Fig 7, « Fonctionnement » : coffret K1, K1T, K2, F1, F2, ampèremètre et enregistreur de courant ; démarrage fractionné, direct pour comparer, K2 qui ne colle pas, K2 câblé à l'envers ; courant d'appel direct 6 × In, un bobinage ≈ 60 %, démarrage montré 4 fois ralenti) et `reperage-fractionne` dans `p3/m6/02-reperage` (Fig 8 : ohmmètre hors tension sur le bornier 1 à 6, réseau de résistances résolu, exercice 50/50 ou 66/33, 1,80 Ω ou 1,35 / 2,70 Ω, OL entre bobinages, plaques G et H). Le repère tournant de l'accouplement de la figure `couplage` est replacé sur l'accouplement. Contrôle des extrémités de traits du skill à 0, vérifié dans le site à 360 px en fr et en en (aucune erreur, aucun défilement horizontal). 383 tests au vert.

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
- Lisibilité des repères à 360 px (2026-10-29, audit Playwright du module 9) : un schéma est affiché sur 313 px de large ; en 640 de large, ses repères de 13 à 16 unités tombaient à 6-8 px. Un schéma de câblage avec appareil, bornes et légendes est donc dessiné en **420 de large au plus** (repères de 14 à 16 unités, soit environ 11 à 12 px rendus), sans vide inutile à droite ; F1 est légendé à droite du disjoncteur pour ne pas sortir du cadre. Les 4 schémas du module 9 suivent cette règle, vérifiée par `test_module_nine_diagrams_stay_readable_on_a_360px_phone`.
- Liaisons PE des schémas développés (2026-10-29, signalé par le propriétaire) : chaque lampe d'un schéma qui porte un rail PE y est reliée (fil vert qui descend sous la lampe, rejoint le rail et se termine par un point de jonction) et le rail PE descend au moins jusqu'à la dernière liaison. Ajouté au double allumage, au télérupteur (L1 remontée pour laisser passer sa liaison) et à la minuterie ; au module 9, rail prolongé et liaison descendue sous la lampe. Vérifié par `test_every_lamp_is_connected_to_the_protective_earth_rail`. Le resserrage des modules 1 à 8 en 420 a été annulé à la demande du propriétaire ; ces schémas restent en 640.
- « Mes cours » reste une **liste ordonnée**, sans bascule liste/grille : les modules forment une progression numérotée, et à 360 px une grille n'aurait qu'une colonne (avis design-taste-frontend du 2026-10-21). Chaque partie affiche sous son titre le nombre de modules et la durée totale (`.part-meta`), un bouton « Continuer » vers le premier module non terminé (absent quand tout est terminé), et sa carte d'examen porte le nom de la partie ; deux parties successives sont séparées de 1,5rem (`.course + .course`).
- Tableau formateur : colonnes de modules repérées « partie.module » (2.3 = module 3 de la partie 2, comme dans le cours), légende en liste de définitions sur plusieurs colonnes (`dl.table-legend`).
- Aucun attribut `style=` dans les gabarits, sauf la largeur calculée d'une barre de progression : les espacements passent par des classes nommées (`.spaced`, `.spaced-lg`, `.list-heading`, `.formation-block`, `.table-legend`) ; vérifié par `config/tests/test_templates.py`.
- Tout bouton d'action principal est dans une `.cta-row` (formulaire compris : `<form class="cta-row">`) pour hériter de la pleine largeur sous 480px.
- Correction de quiz : une réponse longue garde au moins 10rem de large ; le badge « Votre réponse » passe à la ligne au lieu de la comprimer.
- Sous 480px, le bouton d'envoi d'une tentative (`.submit-zone`) est aussi pleine largeur ; l'espace réservé vide du pager (pas de « Précédent ») est masqué pour que « Suivant » s'aligne sur le bord du texte (2026-10-21).
- Sommaire : la coche ou la pastille d'une entrée est calée sur la 1re ligne du titre (`align-items: flex-start` + `margin-top: calc((1lh - taille) / 2)`) ; une entrée d'une seule ligne reste centrée dans ses 44px grâce à `padding-block: max(.4rem, calc((44px - 1lh) / 2))` (2026-10-21).
- Quiz et examen : l'espace sous la dernière réponse est volontaire (`.save-state` réserve la ligne du message « Enregistré » pour éviter tout saut de mise en page).
- **Parcours (2026-10-21, audit Playwright 360 px)** : chaque fin d'étape propose la suivante, calculée par `progress.services.following_step` (prochain module non terminé, sinon l'examen de la partie).
  - Page du module : une seule action principale dans `#suite`, selon l'état : « Commencer » ou « Reprendre la lecture » (1re section non lue), puis « Faire le quiz » quand tout est lu, puis « Module suivant » ou « Voir l'examen » une fois le module terminé (avec un bandeau `.notice-done`). « Fin du module » mène à `#suite`.
  - Correction du quiz : bandeau « Module terminé » et mêmes actions en haut et sous la correction (`assessments/_quiz_actions.html`).
  - Résultat d'examen : « Commencer la partie suivante » quand la partie est réussie ; les modules de « Score par module » sont des liens ; les pourcentages ne passent jamais à la ligne.
  - Sommaire : dernière entrée « Examen de la partie » (cadenas tant qu'il est fermé). Sous chaque section, un lien « Sommaire » (`.to-outline`, masqué à partir de 960px) remonte au sommaire et l'ouvre.
  - Tableau de bord : « Continuer » ou « Voir l'examen » sous la barre de progression, avant la liste des modules.
  - **Pas de bouton flottant « remonter en haut »** : l'en-tête et la barre du chrono sont déjà collés en haut, le pager couvre l'action suivante, et un bouton flottant masquerait du texte ou des réponses à 360px. `html { scroll-padding-top: 80px }` garde les ancres sous l'en-tête.
  - Envoi d'une tentative : `attempt.js` attend la fin des sauvegardes HTMX en cours (bouton `aria-busy`) ; sans cela, une réponse cochée juste avant l'envoi arrivait après la clôture (409) et se perdait sur réseau lent (reproduit avec 1,5 s de latence).
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
- **Partie 2 « Les bases de l'électricité domestique »** (`p2/m1` à `p2/m9`, 2026-10-21, module 9 ajouté le 2026-10-29) : 9 modules de 8 h, 39 sections, 144 questions publiées par `import_content … --publish` (Q23, Q24, Q35), examen de 45 questions tirées (5 par module) réglé par `"exam": {"questions_per_module": 5}`. Choix de transcription : le module 1 commence par un glossaire fr ↔ en (complément) ; la section « Présentation de la partie » (pages 1 et 2 du support) a été retirée à la demande du propriétaire le 2026-10-21 (ordre 1 laissé vide pour que l'import ne décale pas les sections ni les « vu » des apprenants ; sa question de quiz `p2-m1-q01` porte désormais sur les blocs temporisés) ; le module 2 transcrit les 7 étapes, le synopsis et le schéma unifilaire du tableau noir (valeurs recoupées avec la NF C 15-100), et développe en compléments le plan d'implantation, le bilan de puissance, le câble d'arrivée et le devis ; les photos de produits sont remplacées par des tableaux, les schémas par des SVG redessinés ; l'activité pratique du module 8, absente du support, suit le modèle des modules 3 à 7. Après un déploiement, lancer `python manage.py import_content content/froid/formation.json --publish` pour publier les questions relues.
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
1. **Tests** : la suite (`pytest`, 383 tests au 2026-11-09) passe à 100 %. Toute règle métier touchée a ses tests : notation partielle et plancher 0, seuil de 70 %, 3 tentatives et meilleure note, deadline et envoi automatique, reprise de tentative, déblocage de l'examen, cloisonnement formateur ↔ promotion, refus de publication sans double relecture, repli de langue.
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
13. **Banque de la Partie 2** (tests) : au moins 8 questions de quiz et 8 d'examen par module, toutes publiables ; chaque section `content` a au moins une question ; l'examen tire exactement 45 questions (9 modules), 5 par module ; deux tirages successifs diffèrent.
14. **Licences** : `git ls-files` ne contient ni la NF C 15-100, ni une photo du support, ni une image tirée d'internet ; la terminologie anglaise suit le glossaire de la Partie 2 (relecture).
15. **Jalons** (Q30) : chaque jalon J1 à J4 se termine par un arrêt pour validation ; J1 fait valider le style des SVG avant toute production en série. Module 9 (Q40) : un seul jalon, suivi du commit, du push et du déploiement demandés par le propriétaire.
16. **Module 9** (tests et contrôle) : le manifeste liste les 9 titres de Q17/Q31 dans l'ordre ; `p2/m9` a 3 sections `content` et 1 `practical`, chacune en fr et en en ; 4 SVG inertes ≤ 6 Ko, aucune image d'internet reprise ; ≥ 8 questions de quiz et 8 d'examen relues ; `CORRECTIONS.md` contient l'entrée PE (page 39, texte d'origine, correction, justification) ; le glossaire contient les 5 termes de Q36 en fr et en en ; aucun schéma d'association ; après déploiement, `/fr/` et `/en/` répondent 200 et le module 9 s'affiche en production avec ses questions publiées.
17. **Partie 3** (tests `courses/tests/test_part_three.py`, une story par test de US-37 à US-49, chacun vu en échec, et contrôle) :
   - **Structure** : le manifeste liste la partie `p3` et ses 6 modules avec les titres et durées de Q41, dans l'ordre ; les 24 sections de Q51 existent en fr et en en ; une section `practical` par module ; seul `p3/m1/01-glossaire` est un complément ; `test_content_files.py` couvre la Partie 3 (aucun `.md` hors manifeste, aucune langue manquante).
   - **Banque** : ≥ 8 questions de quiz et 8 d'examen par module, toutes publiables (cohérence des choix) et relues fr/en ; chaque section `content` a au moins une question ; l'examen tire exactement 30 questions, 5 par module ; deux tirages successifs diffèrent ; au moins une question porte sur les plaques A et B.
   - **Schémas** : toute image citée existe ; chaque SVG de `p3/` passe `validate_inert_svg`, pèse ≤ 6 Ko et a une `viewBox` de 420 de large au plus ; la courbe Id/In a ses variantes `.fr.svg` et `.en.svg` ; texte alternatif non vide en fr et en en ; aucun fichier matriciel sous `content/froid/p3/` ; capture Playwright à 360 px en clair et en sombre d'au moins un schéma par module, sans défilement horizontal de la page.
   - **Fidélité et corrections** : `content/froid/p3/CORRECTIONS.md` contient les entrées de Q45, l'harmonisation KM1 ligne / KM2 étoile / KM3 triangle (Q46) et une entrée par TAF rédigée (modules 2, 4, 6), chacune avec page, texte d'origine, correction et justification ; le texte servi ne contient ni « 790 V », ni « W1-W3 », ni « octo-coupleur », ni note de correction ; dans `p3/m5`, KM2 est toujours le contacteur étoile et KM3 le contacteur triangle.
   - **Licences et marques** : aucun « Leroy », « Somer », « Kriwan », « Schneider », « Legrand » ni « LA2 DT2 » dans le contenu servi ni dans les SVG ; `git ls-files` ne contient aucune photo du support.
   - **Langue** : le glossaire de `p3/m1` contient les termes de Q49 en fr et en en ; la correspondance IEC 60038 apparaît à la 1re mention des tensions (Q47).
   - **Parcours** : scénario Playwright 360×800 : « Mes cours » affiche la Partie 3 → module 3 → schéma → quiz → examen ouvert seulement après les 6 modules → bascule /fr/ ↔ /en/ ; le tableau formateur et l'export CSV ont les colonnes 3.1 à 3.6.
   - **Jalons** (Q53) : arrêt pour validation après J1 (module 3) ; commit sur `develop` après J3 ; push et déploiement seulement sur demande, puis `/fr/` et `/en/` répondent 200 et la Partie 3 s'affiche en production avec ses 96 questions publiées.
