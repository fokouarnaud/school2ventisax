#!/usr/bin/env bash
# Mise à jour d'Acad Ventisax sur PythonAnywhere : bash ~/school2ventisax/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
VENV="${VENV:-$HOME/.virtualenvs/acad}"
PY="$VENV/bin/python"

git pull --ff-only
"$VENV/bin/pip" install --quiet -r requirements.txt
"$PY" manage.py migrate --noinput
"$PY" manage.py import_content content/froid/formation.json
"$PY" manage.py collectstatic --noinput --verbosity 0
"$PY" manage.py check --deploy --fail-level ERROR
# Recharge l'application web (le fichier WSGI de PythonAnywhere).
touch "/var/www/${PA_DOMAIN:-acadventisax_pythonanywhere_com}_wsgi.py"
echo "Déploiement terminé. Pensez à publier les nouvelles questions dans l'admin."
