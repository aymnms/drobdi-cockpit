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

### J1 — Domaine (fonctions pures) — TDD strict

- [ ] **J1-1** — `semaineISO(date)` → `YYYY-Wxx` (ISO 8601, cas limites année/53 semaines)
- [ ] **J1-2** — `sprintCourant(maintenant)` → wrapper métier
- [ ] **J1-3** — Type `Tache` (schéma v2)
- [ ] **J1-4** — `parseFrontmatter(raw)`
- [ ] **J1-5** — `serializeFrontmatter(tache)` (round-trip)
- [ ] **J1-6** — `validerSchema(tache)` (R1/R2/R4)
- [ ] **J1-7** — `prochainNumeroTD(existants)`
- [ ] **J1-8** — `avancerStatut(tache, statut, aujourdHui)`
- [ ] **J1-9** — `trierVersSprint(tache, sprint)`
- [ ] **J1-10** — `trierVersBacklog(tache)`
- [ ] **J1-11** — `planifierCreneau(tache, debut, fin?)`
- [ ] **J1-12** — `creerTache(titre, projet, existants)`
- [ ] **J1-13** — Revue couverture `src/domain/` (viser 100%)

---

## ⬜ À faire

### J2 — Adaptateur Obsidian (`src/obsidian/`, tests fonctionnels dans `test/functional/` sur vrai FS temporaire)

> Pas de mock de l'API Obsidian ici : tests sur de vrais fichiers `.md` dans un dossier temporaire (`fs.mkdtemp`), pour garantir l'atomicité et la préservation de l'ordre/corps (garde-fou §6 du prompt).

- [ ] **J2-1** — `lireTache(cheminFichier: string): Promise<Tache>` → lit un vrai fichier `.md`, utilise `parseFrontmatter` (J1-4).
- [ ] **J2-2** — `ecrireTache(cheminFichier: string, tache: Tache): Promise<void>` → réécrit uniquement les champs concernés, **préserve le corps de note existant au-delà du `# Titre`**, préserve l'ordre canonique. Test : écrire un champ, vérifier que le reste du fichier (notes libres) est identique au caractère près.
- [ ] **J2-3** — `listerTaches(dossierTaches: string): Promise<Tache[]>` → scanne `taches/*.md`, retourne toutes les tâches parsées.
- [ ] **J2-4** — `detecterSprintCourant(dossierSprints: string, maintenant: Date): Promise<Sprint | null>` → trouve le fichier `Sprint-YYYY-Wxx.md` correspondant à la semaine ISO courante.
- [ ] **J2-5** — Test d'atomicité : écriture interrompue (simulation) ne doit jamais laisser un fichier à moitié écrit — écrire dans un fichier temporaire puis renommer (`rename` atomique du FS).
- [ ] **J2-6** — Test de non-régression : lire un vrai fichier TD existant du vault (fixture copiée depuis `taches/template-tache.md` du projet), le réécrire sans modification logique, diff doit être vide.

### J3 — v0 : squelette plugin

- [ ] **J3-1** — `ItemView` Obsidian minimale enregistrée (`src/obsidian/CockpitView.ts`), ouvrable en onglet. Pas de logique de rendu encore, juste "Cockpit" affiché.
- [ ] **J3-2** — Commande + ruban (ribbon icon) pour ouvrir la vue.
- [ ] **J3-3** — Au chargement de la vue : appelle `detecterSprintCourant` (J2-4) + `listerTaches` (J2-3) filtrées sur le sprint courant, log en console (`console.table` ou équivalent).
- [ ] **J3-4** — Test manuel documenté (procédure dans `docs/test-manuel-v0.md`) : installer dans un vault bac à sable avec fixtures, vérifier la détection.

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

---

## Journal

- **AAAA-MM-JJ** — Création du plan initial (ce fichier), 7 jalons, ~45 tâches. Setup repo local fait hors Claude Code (squelette package.json/tsconfig/esbuild/vitest déjà présent), reste à valider dans l'environnement réel.
- **2026-08-08** — **J0 terminé.** Node.js absent de la machine → installé via Homebrew (node 26.7.0, npm 11.19.0) ; postinstall esbuild approuvé (npm 11). Arborescence `src/{domain,obsidian}` + `test/{unit,functional}` créée, `main.ts` → `src/main.ts`. `.gitignore` créé (le prompt le supposait présent). Build vert, tests verts (0 test). Prêt pour J1.

---

## Rappels de méthode (ne jamais dévier)

1. **TDD strict** : pour toute tâche de J1/J2/J4/J5 touchant à `src/domain` ou `src/obsidian`, le test s'écrit et s'exécute (rouge confirmé) **avant** le code. Pas d'exception.
2. **Le schéma v2 est la loi** (`SYSTEME.md` / `SPEC-scrum-personnel.md` §5.3). Ne jamais le modifier pour simplifier le plugin.
3. **Écriture atomique et minimale** : ne réécrire que les champs concernés, jamais toucher au corps de note, toujours préserver l'ordre canonique des champs frontmatter.
4. **Le plugin ne possède aucune donnée** : pas de base interne, pas d'état persistant dans le vault (un `data.json` du plugin pour du confort d'affichage est toléré, jamais pour des données scrum).
5. **Pas de git dans le plugin, pas de Google Calendar** : hors périmètre (rôle de Drobdi/l'opérateur Claude, pas du plugin).
6. **Commit après chaque tâche verte**, message clair (`feat(domain): ...`, `test(domain): ...`), push régulier.
7. **Ce fichier (`PLAN.md`) est mis à jour à chaque changement de statut de tâche**, sans exception, avant de passer à la suivante.
