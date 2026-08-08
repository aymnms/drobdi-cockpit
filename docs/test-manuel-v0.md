# Test manuel — v0 (jalon J3)

Objectif : vérifier que le plugin se charge dans Obsidian, ouvre son onglet
« Cockpit », détecte le sprint courant et journalise les tâches engagées.

> ⚠️ Ne jamais utiliser le vrai vault `drobdi` (production). Ce test se fait sur
> un **vault bac-à-sable** avec les fixtures fournies.

## 1. Compiler le plugin

```bash
npm install      # une seule fois
npm run build    # produit main.js à la racine
```

## 2. Préparer un vault bac-à-sable

1. Créer un dossier vide, l'ouvrir comme vault dans Obsidian (« Ouvrir un autre coffre »).
2. Copier le contenu de `fixtures/vault-bac-a-sable/` à la racine du vault :
   ```bash
   cp -R fixtures/vault-bac-a-sable/* /chemin/vers/vault-bac-a-sable/
   ```
   Le vault contient alors `taches/`, `sprints/`, `projets/`.
3. Installer le plugin dans ce vault :
   ```bash
   mkdir -p /chemin/vers/vault-bac-a-sable/.obsidian/plugins/drobdi-cockpit
   cp main.js manifest.json styles.css \
      /chemin/vers/vault-bac-a-sable/.obsidian/plugins/drobdi-cockpit/
   ```
4. Dans Obsidian : Paramètres → Modules complémentaires → activer **Drobdi Cockpit**
   (activer d'abord le mode « modules tiers » si demandé).

## 3. Vérifications attendues

- [ ] Une **icône de ruban** (tableau de bord) apparaît dans la barre latérale gauche.
- [ ] La commande **« Drobdi Cockpit : Ouvrir le cockpit »** existe (Cmd/Ctrl+P).
- [ ] Cliquer l'icône (ou lancer la commande) ouvre un onglet **« Cockpit »**.
- [ ] L'onglet affiche une ligne du type :
      `Sprint 2026-W32 (En cours) · 3 tâche(s) engagée(s) · 2 en backlog`.
- [ ] Dans la console développeur (Cmd/Ctrl+Alt+I) :
  - [ ] un message `[drobdi-cockpit] Sprint courant : 2026-W32` ;
  - [ ] un `console.table` listant TD-0001, TD-0002, TD-0003 (les tâches du sprint),
        avec Statut, Priorité, Projet, Début.

## 4. Notes

- La détection du sprint courant utilise la **date réelle du système**. Les
  fixtures sont datées pour **2026-W32** (semaine du 3 au 9 août 2026). Si vous
  testez à une autre date, le cockpit affichera la semaine ISO réelle et
  « aucune fiche sprint » (les tâches n'apparaîtront pas comme engagées tant que
  leur champ `Sprint` ne correspond pas). Pour tester la détection complète hors
  de cette semaine, renommez `sprints/Sprint-2026-W32.md` et le champ `Sprint:`
  des fixtures vers la semaine ISO courante.
- v0 ne fait que **lire** : aucune écriture n'est effectuée à ce stade.
