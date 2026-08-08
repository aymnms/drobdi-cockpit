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

*(rien — ✅ tous les jalons J0→J7 sont terminés.)*

---

## ⬜ À faire

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

### J4 — v0.5 : cockpit lecture seule

- [x] **J4-1 / J4-2** — `tauxRealisation`, `pointsBurndown`, `bornesSemaineISO` (purs, TDD, 15 tests).
- [x] **J4-3** — `rendreBandeau` : jauge % + burndown SVG (7 points). Testé jsdom.
- [x] **J4-4** — `rendreKanban` : 5 colonnes statuts + cartes équilibrées (titre, badge projet coloré, pastille priorité, badge jour). Testé jsdom.
- [x] **J4-5** — `rendreBacklog` : panneau repliable trié par priorité. Testé jsdom.
- [x] **J4-6** — `CockpitView` rendue via `rendreCockpit`, rafraîchissement réactif (`vault.on('modify'/create/delete/rename')` filtré sur taches/sprints, debounce 200 ms). Ouverture de note au clic.
- Archi : rendu DOM standard (`src/ui/`) testable jsdom + fonctionnant dans Obsidian ; `TacheVault = Tache & {id, chemin}` ; `construireCockpit` rendu générique ; helpers de format purs ; `styles.css` (variables de thème Obsidian). +`jsdom`, +`DOM.Iterable`. 90 tests verts.

### J5 — v1 : les 4 gestes (MVP) ✅

- [x] **J5-1** — Geste « Avancer » : drag HTML5 entre colonnes → `avancerStatut` → écriture atomique. Testé jsdom (drop) + fonctionnel (fichier).
- [x] **J5-2** — Geste « Trier backlog ↔ sprint » : drag croisé (contexte DnD partagé) → `trierVersSprint`/`trierVersBacklog`, atomicité vérifiée au niveau fichier.
- [x] **J5-3** — Geste « Capturer » : commande + `CapturerModal` (Entrée) → `creerTache` → nouveau `taches/TD-XXXX.md`. Flux testé fonctionnellement.
- [x] **J5-4** — Geste « Planifier » : clic badge jour → `Menu` des 7 jours de la semaine (+ retrait) → `planifierCreneau`. Clic testé jsdom.
- [x] **J5-5** — `docs/test-manuel-v1.md` (procédure de bout en bout des 4 gestes).
- [x] **J5-6** — Revue MVP : README, version 1.0.0 (manifest+package) + `versions.json`, tag `v1.0.0-mvp`. 98 tests verts, domaine 100 % lignes/fonctions, build vert.

### J6 — v1.1 : polish (post-MVP)

- [x] **J6-1** — `couleurProjet` répartie par angle d'or (déterministe) + accent couleur sur les cartes (variable CSS `--drobdi-accent`). Testé.
- [x] **J6-2** — Pastilles priorité : couleur par niveau (CSS) + `title`/`aria-label` accessibles. Testé.
- [x] **J6-3** — `scripts/install.sh` (copie sûre des artefacts, refuse un non-vault) + `docs/installation-vault-reel.md` (précautions prod, jamais toucher aux données).
- [x] **J6-4** — `docs/guide-utilisateur.md` (lecture du cockpit + 4 gestes) ; README enrichi (liens docs). 99 tests verts, build vert.

### J7 — E2E (post-MVP)

- [x] **J7-1** — `wdio-obsidian-service` configuré (`e2e/wdio.conf.mts`), vault E2E dédié (`e2e/vault/`, fixtures générées pour la semaine courante en `onPrepare`). Script `test:e2e`.
- [x] **J7-2** — Smoke : ouverture du cockpit + sprint courant affiché. **Vert dans Obsidian 1.13.4 réel.**
- [x] **J7-3** — Smoke : geste « avancer » (drag) → fichier passé à `En cours`, corps préservé. **Vert.**
- [x] **J7-4** — Smoke : geste « capturer » → nouveau `TD-XXXX.md` en Backlog. **Vert.**
- [x] **J7-5** — CI GitHub Actions (`.github/workflows/ci.yml`) : job `test` (build+unit+functional) à chaque push/PR, job `e2e` (xvfb, Obsidian headless) sur `main`/manuel.
- Bilan E2E : les 3 smoke tests passent localement dans une vraie instance Obsidian (téléchargée par le service). Corrigé un bug de spec (les closures ne traversent pas `executeObsidian` → passage par arguments).

---

## Journal

- **AAAA-MM-JJ** — Création du plan initial (ce fichier), 7 jalons, ~45 tâches. Setup repo local fait hors Claude Code (squelette package.json/tsconfig/esbuild/vitest déjà présent), reste à valider dans l'environnement réel.
- **2026-08-08** — **J0 terminé.** Node.js absent de la machine → installé via Homebrew (node 26.7.0, npm 11.19.0) ; postinstall esbuild approuvé (npm 11). Arborescence `src/{domain,obsidian}` + `test/{unit,functional}` créée, `main.ts` → `src/main.ts`. `.gitignore` créé (le prompt le supposait présent). Build vert, tests verts (0 test). Prêt pour J1.
- **2026-08-08** — **J1 terminé.** Noyau domaine complet en TDD strict (rouge→vert→commit à chaque groupe) : semaine ISO, type `Tache` + parse/serialize (ordre canonique, round-trip), validation R1/R2/R4, numérotation TD, 5 transitions pures, création. `@vitest/coverage-v8` ajouté. 50 tests verts, 100 % lignes/fonctions sur `src/domain/`. Prêt pour J2 (adaptateur Obsidian, tests fonctionnels sur vrai FS).
- **2026-08-08** — **J2 terminé.** Adaptateur `src/obsidian/vaultFs.ts` (node:fs, sans mock Obsidian) : lire/écrire/lister/detecter + `ecrireAtomique` (temp+rename). Corps & ordre canonique préservés au caractère près, round-trip fichier octet-pour-octet, atomicité vérifiée. Correction d'un cast TS (build `tsc` échouait alors que vitest passait — vitest ne typecheck pas). 64 tests verts, build vert.
- **2026-08-08** — **J3 terminé.** Squelette plugin : `CockpitView` (ItemView) + ruban + commande, câblés à `VaultDrobdi` (runtime Obsidian → vaultFs). Fonction pure `construireCockpit` (filtrage sprint/backlog/colonnes) testée. Fixtures bac-à-sable + doc test manuel v0. esbuild `platform:"node"` pour les builtins `node:`. 68 tests verts, build vert. Vérif E2E réelle dans Obsidian = J7.
- **2026-08-08** — **J4 terminé.** Cockpit lecture seule : métriques pures (taux/burndown) + rendu DOM (bandeau jauge+SVG, kanban 5 colonnes, cartes équilibrées, backlog repliable) testé sous jsdom (Obsidian-agnostique). `CockpitView` branchée + rafraîchissement réactif debouncé + ouverture au clic. CSS thème Obsidian. 90 tests verts, build vert. Reste J5 = les 4 gestes (MVP).
- **2026-08-08** — **🎉 J5 terminé — MVP ATTEINT.** Les 4 gestes câblés : Avancer (drag colonnes), Trier backlog↔sprint (drag croisé), Capturer (commande+modale→nouveau fichier), Planifier (menu jour). Transitions pures + écritures atomiques/minimales, corps et ordre canonique préservés. Tests : jsdom (logique des gestes) + fonctionnels (fichiers). README + version 1.0.0 + `versions.json` + tag `v1.0.0-mvp`. **98 tests verts, domaine 100 % lignes/fonctions, build vert.** J6 (polish) et J7 (E2E) restent planifiés, post-MVP.
- **2026-08-08** — **J6 terminé (polish).** Couleurs projet déterministes (angle d'or) + accent carte, pastilles priorité accessibles, script + doc d'installation en prod (avec précautions), guide utilisateur. 99 tests verts, build vert. Reste J7 (E2E + CI).
- **2026-08-08** — **J7 terminé — PROJET COMPLET (J0→J7).** Harnais E2E `wdio-obsidian-service` : 3 smoke tests (ouverture+sprint, avancer, capturer) **verts dans une vraie instance Obsidian 1.13.4**. CI GitHub Actions (job rapide unit/functional/build + job e2e headless séparé). Bilan global : **99 tests unit/fonctionnels + 3 E2E**, domaine 100 % lignes/fonctions, build vert.
- **2026-08-08** — **Installé sur le vault réel `drobdi`.** Audit lecture seule `scripts/audit-vault.mjs` : **200/200 fichiers tâches round-trip à l'identique** (écriture sûre, aucun champ perdu/réordonné). Git du vault propre. Plugin copié dans `.obsidian/plugins/` (aucune donnée touchée). Activation + 1er geste de contrôle laissés à Aymerick.
- **2026-08-08** — **Sélection de tests par impact.** Hook `.githooks/pre-commit` (typecheck global + `vitest related` sur les fichiers stagés ; suite complète si fichier transverse), activé via `prepare`/`core.hooksPath`. CI : job `test` en `vitest run --changed <base>` (build global conservé, `fetch-depth:0`, repli suite complète si base absente) ; `forceRerunTriggers` étendus (tsconfig/esbuild). Job e2e inchangé.

---

## Rappels de méthode (ne jamais dévier)

1. **TDD strict** : pour toute tâche de J1/J2/J4/J5 touchant à `src/domain` ou `src/obsidian`, le test s'écrit et s'exécute (rouge confirmé) **avant** le code. Pas d'exception.
2. **Le schéma v2 est la loi** (`SYSTEME.md` / `SPEC-scrum-personnel.md` §5.3). Ne jamais le modifier pour simplifier le plugin.
3. **Écriture atomique et minimale** : ne réécrire que les champs concernés, jamais toucher au corps de note, toujours préserver l'ordre canonique des champs frontmatter.
4. **Le plugin ne possède aucune donnée** : pas de base interne, pas d'état persistant dans le vault (un `data.json` du plugin pour du confort d'affichage est toléré, jamais pour des données scrum).
5. **Pas de git dans le plugin, pas de Google Calendar** : hors périmètre (rôle de Drobdi/l'opérateur Claude, pas du plugin).
6. **Commit après chaque tâche verte**, message clair (`feat(domain): ...`, `test(domain): ...`), push régulier.
7. **Ce fichier (`PLAN.md`) est mis à jour à chaque changement de statut de tâche**, sans exception, avant de passer à la suivante.
