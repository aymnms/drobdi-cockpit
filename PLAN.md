# PLAN.md — Kanban drobdi-cockpit

**Ce fichier est la source de vérité de l'avancement du projet.**
Règle absolue : avant de commencer une tâche, la déplacer en `🔵 En cours`.
Dès qu'une tâche est terminée (tests verts inclus), la déplacer en `✅ Terminé` **avant** de commencer la suivante.
Si une tâche est bloquée, la laisser en `🔵 En cours` et ajouter une ligne `> ⚠️ Bloqué : <raison>` juste en dessous, puis passer à la tâche suivante non-bloquante si possible.
Ne jamais supprimer une tâche : la biffer (`~~texte~~`) si elle devient obsolète, avec une raison.

Mettre à jour la section **Journal** (fin de fichier) à chaque bascule de statut, avec la date et un résumé d'une ligne.

Format des ID de tâche : `J<jalon>-<numéro>` (ex. `J0-3` = jalon 0, tâche 3).

---

## Légende des jalons

| Jalon | Nom | Objectif |
|---|---|---|
| J0 | Setup | Repo, build, tests opérationnels |
| J1 | Domaine — noyau | Fonctions pures : semaine ISO, parsing/validation frontmatter, transitions |
| J2 | Adaptateur Obsidian | Lecture/écriture fichiers réelle, respect atomicité + ordre canonique |
| J3 | v0 — squelette plugin | Vue vide, détection sprint courant, liste tâches en console |
| J4 | v0.5 — cockpit lecture seule | Kanban rendu, bandeau %, burndown, panneau backlog |
| J5 | v1 — les 4 gestes | Avancer, trier, capturer, planifier (écriture réelle) |
| J6 | v1.1 — polish | Couleurs projet, pastilles priorité, install vrai vault |
| J7 | E2E | Smoke tests wdio-obsidian-service sur les 4 gestes |

**MVP = fin de J5.** J6 et J7 sont post-MVP mais planifiés pour ne rien perdre de vue.

---

## 🔵 En cours

*(rien — J3 terminé, J4 à démarrer)*

---

## ⬜ À faire

### J4 — v0.5 : cockpit lecture seule

- [ ] **J4-1** — Fonction pure `tauxRealisation(taches: Tache[]): number` (Terminé / engagées) — testée en unitaire (J1-continuation).
- [ ] **J4-2** — Fonction pure `pointsBurndown(taches: Tache[], semaine: {debut: Date, fin: Date}): {jour: Date, restantes: number}[]` — testée en unitaire.
- [ ] **J4-3** — Rendu DOM du bandeau métriques (jauge % + courbe burndown SVG ou canvas simple).
- [ ] **J4-4** — Rendu DOM du kanban (colonnes = statuts v2), cartes équilibrées (titre, badge projet, pastille priorité, badge jour).
- [ ] **J4-5** — Rendu DOM du panneau backlog latéral repliable, trié par priorité.
- [ ] **J4-6** — Rafraîchissement réactif : la vue se met à jour quand un fichier `taches/*.md` change (écoute `app.vault.on('modify')`).

### J5 — v1 : les 4 gestes (MVP)

- [ ] **J5-1** — Geste "Avancer une tâche" : drag & drop entre colonnes kanban → appelle J1-8 → J2-2.
- [ ] **J5-2** — Geste "Trier backlog ↔ sprint" : drag panneau backlog ↔ colonne (et inverse) → J1-9/J1-10 → J2-2, transition atomique vérifiée.
- [ ] **J5-3** — Geste "Capturer une idée" : raccourci clavier global → modal titre (+ projet optionnel) → Entrée → J1-12 → écriture nouveau fichier.
- [ ] **J5-4** — Geste "Planifier dans la semaine" : clic badge jour → sélecteur lun-dim (+ heure optionnelle) → J1-11 → J2-2.
- [ ] **J5-5** — Test manuel documenté de bout en bout des 4 gestes sur vault bac à sable.
- [ ] **J5-6** — **Jalon MVP** : revue globale, mise à jour README du repo, tag git `v1.0.0-mvp`.

### J6 — v1.1 : polish (post-MVP)

- [ ] **J6-1** — Couleurs par projet (palette dérivée du nom de projet, déterministe).
- [ ] **J6-2** — Pastilles priorité (couleur/icône par niveau).
- [ ] **J6-3** — Procédure d'installation dans le vrai vault `drobdi` (dossier `.obsidian/plugins/drobdi-cockpit/`).
- [ ] **J6-4** — Documentation utilisateur courte (README du plugin).

### J7 — E2E (post-MVP)

- [ ] **J7-1** — Setup `wdio-obsidian-service` (à partir du template sample plugin), vault de test dédié.
- [ ] **J7-2** — Smoke test : ouverture du cockpit, sprint courant détecté visible à l'écran.
- [ ] **J7-3** — Smoke test : geste "avancer une tâche" (drag basique) modifie bien le fichier.
- [ ] **J7-4** — Smoke test : geste "capturer" crée bien un nouveau fichier `TD-XXXX.md` valide.
- [ ] **J7-5** — Intégration CI GitHub Actions (unit + functional à chaque push, e2e en job séparé/manuel).

---

## ✅ Terminé

### J0 — Setup

- [x] **J0-1** — Configs vérifiées ; arborescence `src/` créée (`main.ts` déplacé en `src/main.ts` conformément à `esbuild.config.mjs`) ; `npm install` OK.
- [x] **J0-2** — `npm run build` produit `main.js` sans erreur TypeScript.
- [x] **J0-3** — `npm test` s'exécute proprement (0 test, `passWithNoTests` ajouté à `vitest.config.ts`).
- [x] **J0-4** — Premier commit + push sur `main`, avec `PLAN.md` et `.gitignore`.

### J1 — Domaine (fonctions pures, `src/domain/`, TDD strict)

- [x] **J1-1 / J1-2** — `semaineISO` + `sprintCourant` (ISO 8601, cas limites année/53 semaines). 7 tests.
- [x] **J1-3 / J1-4 / J1-5** — Type `Tache` (schéma v2) + `parseFrontmatter`/`serializeFrontmatter`. Parseur maison → ordre canonique préservé, corps verbatim, round-trip vérifié, champs hors schéma collectés. 13 tests.
- [x] **J1-6** — `validerSchema` (R1/R2/R4 + domaines Statut/Priorité + invariant Sprint⟺Backlog + champs requis). 11 tests.
- [x] **J1-7** — `prochainNumeroTD` (max+1, padding 4, jamais réutilisé). 8 tests.
- [x] **J1-8..J1-12** — `avancerStatut`, `trierVersSprint`, `trierVersBacklog`, `planifierCreneau`, `creerTache`. Transitions pures immuables, écriture minimale. 13 tests.
- [x] **J1-13** — Couverture `src/domain/` : **100 % statements/functions/lines** (branches 93,6 %, reste = garde-fous défensifs `?? ""` inatteignables). 50 tests au total.

### J2 — Adaptateur Obsidian (`src/obsidian/vaultFs.ts`, tests fonctionnels sur vrai FS)

- [x] **J2-1** — `lireTache(chemin)` (node:fs + `parseFrontmatter`).
- [x] **J2-2** — `ecrireTache(chemin, tache)` : corps préservé au caractère près + ordre canonique vérifiés par test.
- [x] **J2-3** — `listerTaches(dossier)` : ne retient que `TD-XXXX.md` (template/autres ignorés).
- [x] **J2-4** — `detecterSprintCourant(dossier, maintenant)` → `FichierSprint | null` (via `lireChampsBruts`).
- [x] **J2-5** — `ecrireAtomique` (temp + `rename`) : aucun résidu `.tmp`, cible jamais partielle.
- [x] **J2-6** — Non-régression : `lireTache` → `ecrireTache` d'une tâche canonique ⇒ fichier identique octet pour octet.
- Note archi : adaptateur `node:fs` (pas de mock Obsidian) réutilisant parse/serialize ; mêmes garanties que `processFrontMatter`. Câblage runtime Obsidian en J3+. 14 tests fonctionnels+unit ajoutés (64 au total).

### J3 — v0 : squelette plugin

- [x] **J3-1** — `CockpitView` (`ItemView`) enregistrée, ouvrable en onglet, en-tête « Cockpit ».
- [x] **J3-2** — Ruban (icône `layout-dashboard`) + commande « Ouvrir le cockpit » (`activerVue` révèle/ouvre l'onglet).
- [x] **J3-3** — `VaultDrobdi.charger()` (résolution base via `FileSystemAdapter`) → `detecterSprintCourant` + `listerTaches` + `construireCockpit` (fonction pure filtrage/colonnes, testée) ; résumé à l'écran + `console.table` des tâches du sprint.
- [x] **J3-4** — `docs/test-manuel-v0.md` + fixtures `fixtures/vault-bac-a-sable/` (taches/sprints/projets, sprint 2026-W32).
- Correctif build : esbuild `platform: "node"` pour externaliser les imports `node:` (fs/promises, path). 68 tests verts, build vert.

---

## Journal

- **AAAA-MM-JJ** — Création du plan initial (ce fichier), 7 jalons, ~45 tâches. Setup repo local fait hors Claude Code (squelette package.json/tsconfig/esbuild/vitest déjà présent), reste à valider dans l'environnement réel.
- **2026-08-08** — **J0 terminé.** Node.js absent de la machine → installé via Homebrew (node 26.7.0, npm 11.19.0) ; postinstall esbuild approuvé (npm 11). Arborescence `src/{domain,obsidian}` + `test/{unit,functional}` créée, `main.ts` → `src/main.ts`. `.gitignore` créé (le prompt le supposait présent). Build vert, tests verts (0 test). Prêt pour J1.
- **2026-08-08** — **J1 terminé.** Noyau domaine complet en TDD strict (rouge→vert→commit à chaque groupe) : semaine ISO, type `Tache` + parse/serialize (ordre canonique, round-trip), validation R1/R2/R4, numérotation TD, 5 transitions pures, création. `@vitest/coverage-v8` ajouté. 50 tests verts, 100 % lignes/fonctions sur `src/domain/`. Prêt pour J2 (adaptateur Obsidian, tests fonctionnels sur vrai FS).
- **2026-08-08** — **J2 terminé.** Adaptateur `src/obsidian/vaultFs.ts` (node:fs, sans mock Obsidian) : lire/écrire/lister/detecter + `ecrireAtomique` (temp+rename). Corps & ordre canonique préservés au caractère près, round-trip fichier octet-pour-octet, atomicité vérifiée. Correction d'un cast TS (build `tsc` échouait alors que vitest passait — vitest ne typecheck pas). 64 tests verts, build vert.
- **2026-08-08** — **J3 terminé.** Squelette plugin : `CockpitView` (ItemView) + ruban + commande, câblés à `VaultDrobdi` (runtime Obsidian → vaultFs). Fonction pure `construireCockpit` (filtrage sprint/backlog/colonnes) testée. Fixtures bac-à-sable + doc test manuel v0. esbuild `platform:"node"` pour les builtins `node:`. 68 tests verts, build vert. Vérif E2E réelle dans Obsidian = J7.

---

## Rappels de méthode (ne jamais dévier)

1. **TDD strict** : pour toute tâche de J1/J2/J4/J5 touchant à `src/domain` ou `src/obsidian`, le test s'écrit et s'exécute (rouge confirmé) **avant** le code. Pas d'exception.
2. **Le schéma v2 est la loi** (`SYSTEME.md` / `SPEC-scrum-personnel.md` §5.3). Ne jamais le modifier pour simplifier le plugin.
3. **Écriture atomique et minimale** : ne réécrire que les champs concernés, jamais toucher au corps de note, toujours préserver l'ordre canonique des champs frontmatter.
4. **Le plugin ne possède aucune donnée** : pas de base interne, pas d'état persistant dans le vault (un `data.json` du plugin pour du confort d'affichage est toléré, jamais pour des données scrum).
5. **Pas de git dans le plugin, pas de Google Calendar** : hors périmètre (rôle de Drobdi/l'opérateur Claude, pas du plugin).
6. **Commit après chaque tâche verte**, message clair (`feat(domain): ...`, `test(domain): ...`), push régulier.
7. **Ce fichier (`PLAN.md`) est mis à jour à chaque changement de statut de tâche**, sans exception, avant de passer à la suivante.
