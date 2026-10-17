# Acad Ventisax

Plateforme de formation et d'évaluation en ligne du centre LA VOCATION, inspirée des principes d'interface de Cisco NetAcad : lecteur de cours par modules, quiz d'entraînement, examen de partie chronométré et suivi des apprenants par les formateurs.

- **Production** : https://acadventisax.pythonanywhere.com/fr/ (et `/en/`)
- **Site vitrine** : https://ventisax.pythonanywhere.com/fr/ (simple lien, comptes indépendants)
- **Contenu v1** : formation « Froid et climatisation », Partie 1 complète (6 modules, 31 sections, 73 questions), en français et en anglais.

> Les décisions du projet (grill, objectifs, PRD, guide de style, Definition of Done) sont dans [AGENTS.md](AGENTS.md), qui fait foi. [CLAUDE.md](CLAUDE.md) en est la copie pour Claude Code.

## Fonctionnalités

| Rôle | Ce qu'il peut faire |
|---|---|
| **Apprenant** | Lire les sections d'un module (sommaire repliable, sections vues cochées), consulter les activités pratiques et leurs annexes, refaire les quiz sans limite avec correction et explication, passer l'examen de partie quand tous les modules sont terminés, changer de langue à tout moment |
| **Formateur** | Voir le tableau apprenants × modules de ses promotions seulement, l'exporter en CSV, relire et publier les questions (publication refusée si le français ou l'anglais n'est pas relu) |
| **Admin** | Créer les promotions et les comptes (import CSV, mots de passe générés), régler les examens, importer le contenu depuis le dépôt |

**Règles d'évaluation**
- Quiz de module : illimité, sans chrono, non noté.
- Examen de partie : 70 % pour réussir, 3 tentatives, 60 min chronométrées côté serveur, questions et choix mélangés, meilleure note retenue, score partiel sur les QCM à plusieurs réponses.
- Chaque réponse d'examen est enregistrée au clic : après une coupure, l'apprenant reprend avec le temps restant réel ; à l'heure limite, la tentative est envoyée automatiquement.

## Stack

- Python 3, **Django 5.2 LTS**, **SQLite** (un seul fichier)
- Gabarits serveur + **HTMX vendoré** (aucun CDN, aucun Node, aucune SPA), CSS écrit à la main, mobile d'abord
- Dépendances de production limitées à quatre : `django`, `django-modeltranslation`, `markdown`, `bleach`
- Tests : `pytest` + `pytest-django` (développement seulement)
- Hébergement : plan gratuit PythonAnywhere (disque de 512 Mo, cible < 150 Mo)

## Démarrage en local

```bash
git clone https://github.com/fokouarnaud/school2ventisax.git
cd school2ventisax
python -m venv .venv
source .venv/bin/activate            # Windows : .venv\Scripts\activate
pip install -r requirements-dev.txt

python manage.py migrate
python manage.py import_content content/froid/formation.json
python manage.py createsuperuser
python manage.py runserver
```

Ouvrir http://127.0.0.1:8000/fr/. Sans fichier `.env`, l'application tourne en mode développement (`DEBUG` actif, clé de développement).

Les questions importées restent en **brouillon** : un formateur les publie dans l'admin (« Gestion » puis « Questions », action « Publier les questions sélectionnées »), une fois les deux langues relues.

## Configuration

Les réglages sensibles viennent de l'environnement ou d'un fichier `.env` à la racine (ignoré par git). Modèle : [.env.example](.env.example).

| Variable | Rôle |
|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète ; obligatoire en production (au moins 50 caractères variés), sinon l'application refuse de démarrer |
| `DJANGO_DEBUG` | `0` en production, `1` (par défaut) en développement |
| `DJANGO_ALLOWED_HOSTS` | Noms d'hôte autorisés, séparés par des virgules |
| `DJANGO_BACKUP_DIR` | Dossier de la sauvegarde quotidienne de la base ; vide = désactivée |
| `DJANGO_STATIC_ROOT` | Dossier de `collectstatic` (par défaut `staticfiles/`) |

Ne jamais committer de secret : ni dans le code, ni dans AGENTS.md ou CLAUDE.md.

## Commandes utiles

| Commande | Usage |
|---|---|
| `pytest` | Toute la suite de tests (234 tests, dont 62 tests d'intrusion) |
| `pytest config/tests/test_intrusion.py` | Tests d'intrusion seuls |
| `python manage.py import_content content/froid/formation.json` | Importe ou met à jour cours et questions ; idempotent |
| `python manage.py backup_db <dossier>` | Copie la base SQLite ; seule la copie la plus récente est gardée |
| `python manage.py check --deploy` | Contrôle des réglages de production (avec `DJANGO_DEBUG=0`) |

Traductions de l'interface (gettext requis) :

```bash
python manage.py makemessages -l en --ignore=.venv --ignore=reference --ignore=staticfiles --ignore=.playwright-mcp --ignore=conftest.py --ignore="*/tests/*"
# traduire locale/en/LC_MESSAGES/django.po, puis :
python manage.py compilemessages -l en --ignore=.venv
```

## Contenu des cours

Le contenu est versionné dans `content/froid/` :

```
content/froid/
├── formation.json            manifeste : parties, modules, sections
└── p1/m1 … m6/
    ├── NN-section.fr.md      texte de la section en français
    ├── NN-section.en.md      sa traduction anglaise
    └── questions.json        questions de quiz et d'examen (fr et en)
```

Les fichiers Markdown sont rendus en HTML puis nettoyés par bleach. Des tests vérifient que chaque texte existe dans les deux langues, que chaque fichier est référencé par le manifeste et que chaque section a au moins une question.

## Structure du code

| Dossier | Contenu |
|---|---|
| `accounts/` | Utilisateur à rôles, promotions, import CSV, verrouillage anti force brute de la connexion |
| `courses/` | Formation, parties, modules, sections, annexes ; lecteur de cours ; commande `import_content` |
| `assessments/` | Questions, choix, quiz et examens, tentatives, notation (`scoring.py`) |
| `progress/` | Sections vues, progression, tableau et export CSV des formateurs, sauvegarde quotidienne |
| `config/` | Réglages, URL, CSP, fichiers téléversés, tests transverses dont les tests d'intrusion |
| `templates/`, `static/` | Gabarits, CSS, JavaScript et HTMX vendoré |
| `locale/` | Traductions anglaises de l'interface |

## Sécurité

Un audit du code a été mené le 2026-10-17 ; chaque faille est rejouée par un test dans `config/tests/test_intrusion.py`. Détail dans la section « Audit de sécurité et tests d'intrusion » d'[AGENTS.md](AGENTS.md).

- **Identifiants publics UUID** : les URL et les formulaires n'exposent jamais les clés entières de la base (`/modules/<uuid>/`).
- **Injection SQL** : ORM paramétré partout ; entrées validées avant toute requête (400 si invalides).
- **XSS** : Markdown nettoyé par bleach, gabarits échappés, CSP sans script en ligne, SVG actifs refusés au téléversement.
- **CSRF** : toute action qui modifie l'état passe par un POST avec jeton.
- **Session** : cookies `HttpOnly` et `SameSite=Lax`, durée de 8 h, préfixe `__Host-` et HSTS d'un an en production ; 5 échecs de connexion en 15 min verrouillent l'identifiant.
- **Cloisonnement** : un apprenant ne voit que sa promotion ; un formateur, que ses promotions.
- **Export CSV** : les formules de tableur sont neutralisées.

Limite connue : les fichiers téléversés (annexes, images) sont servis sans contrôle d'accès ; leur nom aléatoire empêche seulement de deviner leur adresse.

## Déploiement (PythonAnywhere)

Le serveur suit la branche `main`. Le développement se fait sur `develop`, fusionné dans `main` avant chaque déploiement.

Dans une console Bash PythonAnywhere :

```bash
cd ~/school2ventisax
~/.virtualenvs/acad/bin/python manage.py backup_db ~/backups   # copie avant migration
bash deploy.sh
```

`deploy.sh` enchaîne : `git pull`, installation des dépendances, migrations, import du contenu, `collectstatic`, `check --deploy`, puis rechargement de l'application web. Pensez ensuite à publier les nouvelles questions dans l'admin.

Le plan gratuit n'offrant pas de tâche planifiée, la sauvegarde quotidienne est déclenchée par la première requête qui suit 24 h sans copie (`progress.middleware.DailyBackupMiddleware`).

## Licence

[MIT](LICENSE). Aucun texte, question, logo ni asset de NetAcad ou de Cisco n'est repris : seuls des principes d'interface ont inspiré le projet.
