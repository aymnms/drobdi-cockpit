# drobdi-cockpit

Cockpit de sprint pour le système de **scrum personnel** _drobdi_ — un plugin
Obsidian qui ouvre l'état de la semaine en cours (kanban + progression) et permet
d'exécuter les quatre gestes quotidiens en deux actions maximum, sans
configuration.

> **Interface jetable, données éternelles.** Le plugin ne possède aucune donnée :
> il lit et écrit uniquement le frontmatter des fichiers Markdown du vault, au
> schéma _drobdi_ v2. Le supprimer ne perd rien.

## Ce que fait le cockpit

- **Bandeau métriques** : jauge de réalisation du sprint (Terminé / engagées) et
  courbe de burndown reconstruite depuis les dates `Réalisé le`.
- **Kanban du sprint courant** : colonnes = statuts (À faire · En cours · Terminé ·
  Reporté · Abandonné). Le sprint courant (semaine ISO) est détecté tout seul.
- **Panneau backlog** latéral repliable, trié par priorité.

### Les 4 gestes

| Geste | Interaction | Effet fichier |
|---|---|---|
| **Avancer** | glisser une carte entre colonnes | `Statut` mis à jour ; vers Terminé → ajoute `Réalisé le` |
| **Trier** backlog ↔ sprint | glisser backlog ↔ colonne | atomique : `Sprint` + `Statut` ensemble |
| **Capturer** | commande « Capturer une idée » → titre → Entrée | nouveau `TD-XXXX` en Backlog |
| **Planifier** | clic sur le badge jour → lun-dim | écrit `Début` |

Hors périmètre (assumé) : sous-tâches, dépendances, time tracking, assignés,
Gantt, vues configurables, git, Google Calendar.

## Installation (manuelle)

```bash
npm install
npm run build        # produit main.js
```

Copier `main.js`, `manifest.json`, `styles.css` dans
`<vault>/.obsidian/plugins/drobdi-cockpit/`, puis activer le module dans les
paramètres d'Obsidian. Ouvrir le cockpit via l'icône de ruban ou la commande
« Drobdi Cockpit : Ouvrir le cockpit ».

> Desktop-first : les lectures/écritures passent par le système de fichiers
> (Node). Le support mobile n'est pas ciblé pour le MVP.

## Développement

Architecture en couches, testées à des niveaux distincts :

- `src/domain/` — **fonctions pures** (semaine ISO, parse/sérialisation du
  frontmatter, validation du schéma, transitions, métriques). Testées en
  **unitaire** (Vitest), sans dépendance Obsidian.
- `src/obsidian/` — **adaptateur** système de fichiers + intégration Obsidian
  (`ItemView`, commandes, modale). La couche FS est testée en **fonctionnel** sur
  un vrai dossier temporaire (aucun mock de l'API Obsidian).
- `src/ui/` — **rendu DOM** (standard, testé sous jsdom, fonctionnant tel quel
  dans Obsidian) et helpers de formatage purs.

```bash
npm test              # tout
npm run test:unit
npm run test:functional
npx vitest run --coverage
```

Méthode : **TDD strict** (test rouge → code minimal → vert → commit). Le schéma de
données v2 est la référence ; toute écriture est atomique, minimale, et préserve
l'ordre canonique des champs ainsi que le corps des notes.

Le suivi d'avancement détaillé (jalons, journal) est dans [`PLAN.md`](./PLAN.md).

Documentation :
- [Guide utilisateur](./docs/guide-utilisateur.md)
- [Installation dans le vault réel](./docs/installation-vault-reel.md) · script `scripts/install.sh`
- Tests manuels : [v0](./docs/test-manuel-v0.md) · [v1 / 4 gestes](./docs/test-manuel-v1.md)

## Crédits

Le rendu kanban / glisser-déposer s'inspire (étude, sans copie) du plugin
**Kanban Bases View** de I. Welch Canavan (MIT).
