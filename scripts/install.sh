#!/usr/bin/env bash
# Installe (ou met à jour) drobdi-cockpit dans un vault Obsidian.
#
# Usage : ./scripts/install.sh "/chemin/vers/le/vault"
#
# Copie uniquement les artefacts du plugin (main.js, manifest.json, styles.css)
# dans <vault>/.obsidian/plugins/drobdi-cockpit/. Ne touche à AUCUNE donnée du
# vault (taches/, sprints/, projets/, journal/…).
set -euo pipefail

VAULT="${1:-}"
if [[ -z "$VAULT" ]]; then
  echo "Usage : $0 \"/chemin/vers/le/vault\"" >&2
  exit 1
fi
if [[ ! -d "$VAULT/.obsidian" ]]; then
  echo "Erreur : \"$VAULT\" ne ressemble pas à un vault Obsidian (.obsidian introuvable)." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Construire si nécessaire.
if [[ ! -f "$ROOT/main.js" ]]; then
  echo "main.js absent — compilation…"
  (cd "$ROOT" && npm run build)
fi

DEST="$VAULT/.obsidian/plugins/drobdi-cockpit"
mkdir -p "$DEST"
cp "$ROOT/main.js" "$ROOT/manifest.json" "$ROOT/styles.css" "$DEST/"

echo "✓ Installé dans : $DEST"
echo "  Active « Drobdi Cockpit » dans Paramètres → Modules complémentaires,"
echo "  puis recharge le plugin s'il était déjà actif (désactiver/réactiver)."
