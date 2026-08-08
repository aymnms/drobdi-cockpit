# Installation dans le vrai vault `drobdi`

> ⚠️ **Le vault `drobdi` est en production** (rituels automatisés, synchro Google
> Calendar, commits git par Drobdi). N'installe le plugin qu'une fois les 4 gestes
> validés sur un vault bac-à-sable (`docs/test-manuel-v1.md`).

Le plugin **ne possède aucune donnée** et n'écrit que le frontmatter des fichiers
`taches/TD-XXXX.md` (et ne crée de nouveaux fichiers que via le geste Capturer).
Il ne fait **pas** de git et ne touche **pas** à Google Calendar. Néanmoins, par
prudence avant une première installation en production :

## Précautions

1. **Sauvegarde / commit propre** : le vault `drobdi` est un clone git. Assure-toi
   que `git status` est propre (tout est commité/poussé) avant d'installer, pour
   pouvoir revenir en arrière (`git diff`) si besoin.
2. **Vérifie les noms de dossiers** : le plugin attend `taches/` et `sprints/` à la
   racine du vault (voir « Configuration » ci-dessous si ta structure diffère).
3. **Champ `Google Event ID`** : géré par Drobdi. Le plugin le **préserve** mais
   n'y touche jamais — vérifie tout de même après tes premiers gestes qu'il est
   intact (le round-trip est testé, mais la prudence en prod prime).

## Installation

Depuis le dépôt du plugin :

```bash
npm run build
./scripts/install.sh "/chemin/vers/le/vault/drobdi"
```

Puis dans Obsidian : Paramètres → Modules complémentaires → activer **Drobdi
Cockpit**. Ouvre le cockpit via l'icône de ruban ou la commande
« Drobdi Cockpit : Ouvrir le cockpit ».

Mise à jour ultérieure : relancer les deux mêmes commandes, puis désactiver /
réactiver le plugin (ou recharger Obsidian) pour charger le nouveau `main.js`.

## Configuration

Les noms de dossiers (`taches`, `sprints`) sont, pour le MVP, les valeurs par
défaut du système drobdi. Si ta structure diffère, ils sont centralisés dans
`DOSSIERS_PAR_DEFAUT` (`src/obsidian/vaultRuntime.ts`) — une page de réglages
utilisateur est une évolution possible post-MVP.

## Désinstallation

Désactiver le module dans Obsidian, puis supprimer le dossier
`<vault>/.obsidian/plugins/drobdi-cockpit/`. **Aucune donnée du vault n'est
perdue** : tout vit dans les fichiers Markdown.
