# Test manuel — v1 / MVP (jalon J5) : les 4 gestes

Prérequis : avoir réalisé l'installation décrite dans `test-manuel-v0.md`
(compilation, vault bac-à-sable avec fixtures, plugin activé). Ouvrir le cockpit.

> ⚠️ Vault bac-à-sable uniquement. Ne jamais tester sur le vrai vault `drobdi`.
> La détection du sprint utilise la date réelle : si vous n'êtes pas en semaine
> 2026-W32, renommez `sprints/Sprint-2026-W32.md` et les champs `Sprint:` des
> fixtures vers la semaine ISO courante (voir note de `test-manuel-v0.md`).

Après chaque geste, vérifier **le fichier `.md`** correspondant (le plugin ne
possède aucune donnée : la vérité est dans le frontmatter).

## Geste 1 — Avancer une tâche (drag entre colonnes)

1. Glisser la carte **TD-0002** (« Choisir la palette ») de *À faire* vers *En cours*.
2. Attendu à l'écran : la carte change de colonne, les compteurs se mettent à jour.
3. Attendu fichier `taches/TD-0002.md` : `Statut: En cours`, aucun autre champ modifié.
4. Glisser une carte vers **Terminé**.
5. Attendu fichier : `Statut: Terminé` **et** `Réalisé le: <date du jour>` ajouté.
      Le corps de la note et l'ordre des champs sont inchangés.

## Geste 2 — Trier backlog ↔ sprint (drag)

1. Déplier le panneau **Backlog** (à droite) si replié (clic sur l'en-tête).
2. Glisser **TD-0005** (« raccourci de capture globale ») du backlog vers une colonne du kanban.
3. Attendu fichier `taches/TD-0005.md` (transition **atomique**) :
   - `Statut: À faire`
   - `Sprint: <semaine courante>` (renseigné en même temps).
4. Inversement, glisser une carte du kanban vers le panneau Backlog.
5. Attendu fichier : `Statut: Backlog` **et** `Sprint:` vidé, ensemble.

## Geste 3 — Capturer une idée (commande + modal)

1. Cmd/Ctrl+P → **« Drobdi Cockpit : Capturer une idée »** (assigner un raccourci
   dans Paramètres → Raccourcis pour un accès en un geste).
2. Saisir un titre (ex. « Tester la capture »), laisser le projet vide ou le renseigner, **Entrée**.
3. Attendu : une notice « Tâche TD-XXXX capturée », un nouveau fichier
   `taches/TD-XXXX.md` (numéro = max existant + 1) apparaît dans le panneau Backlog.
4. Attendu fichier : frontmatter canonique complet, `Statut: Backlog`, `Sprint:` vide,
   corps commençant par `# <Titre>`.

## Geste 4 — Planifier dans la semaine (clic badge jour)

1. Sur une carte du sprint, cliquer le badge **« planifier »** (ou le badge jour existant).
2. Un menu propose les 7 jours de la semaine (lun→dim). Choisir un jour.
3. Attendu à l'écran : le badge affiche le jour choisi.
4. Attendu fichier : `Début: <AAAA-MM-JJ>` écrit (journée entière). Aucune `Fin` sans `Début`.
5. Re-cliquer le badge → **« Retirer la planification »** : `Début` (et `Fin`) disparaissent du fichier.

## Vérifications transverses

- [ ] Aucune écriture n'ajoute de champ hors schéma (R1).
- [ ] Aucun fichier `.tmp` résiduel dans `taches/` (écriture atomique).
- [ ] Modifier un fichier `taches/*.md` à la main (hors plugin) → le cockpit se
      rafraîchit automatiquement (J4-6).
- [ ] Le corps des notes n'est jamais altéré par un geste.
