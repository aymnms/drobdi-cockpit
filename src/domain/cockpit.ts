import { PRIORITES, STATUTS_KANBAN, type Statut, type Tache } from "./tache";

/** Vue de données prête à afficher : ce que le cockpit consomme (pure, testable). */
export interface CockpitData {
  /** Sprint courant (`YYYY-Wxx`). */
  sprintId: string;
  /** Tâches engagées sur le sprint courant (hors Backlog). */
  tachesSprint: Tache[];
  /** Tâches Backlog, triées par priorité décroissante. */
  backlog: Tache[];
  /** Tâches du sprint réparties par statut = colonnes du kanban. */
  parStatut: Record<Statut, Tache[]>;
}

const rangPriorite = (t: Tache): number => {
  const i = PRIORITES.indexOf(t.priorite);
  return i === -1 ? PRIORITES.length : i;
};

/**
 * Construit la vue de données du cockpit à partir de toutes les tâches du vault
 * et de l'identifiant du sprint courant. Fonction pure : aucune I/O, aucune
 * dépendance Obsidian → testable en unitaire et réutilisable par le rendu (J4).
 */
export function construireCockpit(taches: Tache[], sprintId: string): CockpitData {
  const tachesSprint = taches.filter(
    (t) => t.statut !== "Backlog" && t.sprint === sprintId,
  );

  const backlog = taches
    .filter((t) => t.statut === "Backlog")
    .sort((a, b) => rangPriorite(a) - rangPriorite(b));

  const parStatut = Object.fromEntries(
    STATUTS_KANBAN.map((s) => [s, tachesSprint.filter((t) => t.statut === s)]),
  ) as Record<Statut, Tache[]>;

  return { sprintId, tachesSprint, backlog, parStatut };
}
