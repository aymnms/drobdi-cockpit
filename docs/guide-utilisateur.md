# Guide utilisateur — drobdi-cockpit

Le cockpit affiche l'état de ton **sprint courant** (la semaine ISO en cours,
détectée automatiquement) et te permet de faire tes gestes quotidiens sans quitter
Obsidian. Tout ce que tu fais est écrit dans le frontmatter de tes fichiers
`taches/TD-XXXX.md` — rien n'est stocké ailleurs.

## Ouvrir le cockpit

- Icône **tableau de bord** dans le ruban (barre latérale gauche), ou
- Commande **« Drobdi Cockpit : Ouvrir le cockpit »** (Cmd/Ctrl+P).

## Lire son sprint d'un coup d'œil

- **En haut** : la jauge indique le pourcentage de tâches terminées, et la courbe
  de burndown montre les tâches restantes jour par jour (reconstruite depuis
  `Réalisé le`).
- **Au centre** : le kanban du sprint, une colonne par statut.
- **À droite** : le backlog, trié par priorité — clique l'en-tête pour le replier.

Sur chaque carte : le titre, un **badge projet** coloré (couleur stable par
projet), une **pastille de priorité**, et un **badge jour** si la tâche est
planifiée. Clique une carte pour ouvrir la note.

## Les 4 gestes

| Je veux… | Je fais… |
|---|---|
| **Avancer** une tâche | je la glisse d'une colonne à l'autre. Vers *Terminé*, la date de réalisation est ajoutée automatiquement. |
| **Sortir/entrer** une tâche du sprint | je la glisse entre le backlog et le kanban. Le sprint et le statut sont mis à jour ensemble. |
| **Capturer** une idée | commande *« Capturer une idée »* → je tape un titre (projet optionnel) → Entrée. La tâche arrive dans le backlog. |
| **Planifier** une tâche | je clique son badge jour (ou *« planifier »*) → je choisis un jour de la semaine. |

Astuce : assigne un raccourci clavier à *« Capturer une idée »* (Paramètres →
Raccourcis) pour capturer en un seul geste.

## Bon à savoir

- Le cockpit se **met à jour tout seul** quand un fichier de `taches/` ou
  `sprints/` change (même modifié à la main ou par un autre outil).
- Le plugin ne fait **pas** de git et ne touche **pas** à Google Calendar : ces
  rôles restent ceux de Drobdi.
- Désinstaller le plugin ne perd **aucune** donnée.
