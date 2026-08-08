import type { Tache } from "./tache";

/**
 * Métriques de sprint (fonctions pures). Les tâches passées sont les tâches
 * ENGAGÉES du sprint (non-Backlog, sprint courant) — cf. `construireCockpit`.
 */

/** `YYYY-MM-DD` local d'une date (pour comparaison lexicographique avec `Réalisé le`). */
function dateISO(d: Date): string {
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/**
 * Taux de réalisation du sprint : `Terminé / engagées`, dans `[0, 1]`.
 * Retourne 0 pour un sprint vide (jamais NaN).
 */
export function tauxRealisation(taches: Tache[]): number {
  if (taches.length === 0) return 0;
  const termine = taches.filter((t) => t.statut === "Terminé").length;
  return termine / taches.length;
}

/** Un point de la courbe de burndown : nombre de tâches restantes en fin de journée. */
export interface PointBurndown {
  jour: Date;
  restantes: number;
}

/**
 * Reconstitue le burndown jour par jour sur la semaine `[debut, fin]` (bornes
 * incluses) à partir des dates `Réalisé le`. `restantes(jour)` = total engagé −
 * (tâches Terminé dont `Réalisé le` ≤ jour). Une tâche Terminé sans `Réalisé le`
 * n'est pas plaçable et reste comptée comme restante.
 */
export function pointsBurndown(
  taches: Tache[],
  semaine: { debut: Date; fin: Date },
): PointBurndown[] {
  const total = taches.length;
  const datesRealisation = taches
    .filter((t) => t.statut === "Terminé" && t.realiseLe)
    .map((t) => t.realiseLe as string);

  const points: PointBurndown[] = [];
  const jour = new Date(
    semaine.debut.getFullYear(),
    semaine.debut.getMonth(),
    semaine.debut.getDate(),
  );

  while (jour <= semaine.fin) {
    const borne = dateISO(jour);
    const realisees = datesRealisation.filter((d) => d <= borne).length;
    points.push({ jour: new Date(jour), restantes: Math.max(0, total - realisees) });
    jour.setDate(jour.getDate() + 1);
  }
  return points;
}
