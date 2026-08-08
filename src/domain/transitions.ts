import type { Statut, Tache } from "./tache";

/**
 * Transitions pures du schéma v2. Toutes renvoient une NOUVELLE `Tache` (jamais
 * de mutation de l'entrée) et n'écrivent que le strict nécessaire (§6 : écriture
 * minimale). Ce sont les briques appelées par les 4 gestes (J5).
 */

/** Formate une date en `YYYY-MM-DD` (composantes locales). */
function dateISO(d: Date): string {
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/**
 * Geste « Avancer une tâche » : change `Statut`. En arrivant sur `Terminé`,
 * ajoute `Réalisé le: <aujourd'hui>`. Ne touche à aucun autre champ.
 */
export function avancerStatut(tache: Tache, nouveauStatut: Statut, aujourdHui: Date): Tache {
  const suite: Tache = { ...tache, statut: nouveauStatut };
  if (nouveauStatut === "Terminé") {
    suite.realiseLe = dateISO(aujourdHui);
  }
  return suite;
}

/**
 * Geste « Trier backlog → sprint » : transition ATOMIQUE. Pose `Sprint` et
 * `Statut: "À faire"` ensemble (jamais l'un sans l'autre).
 */
export function trierVersSprint(tache: Tache, sprint: string): Tache {
  return { ...tache, sprint, statut: "À faire" };
}

/**
 * Geste « Trier sprint → backlog » : transition ATOMIQUE inverse. Vide `Sprint`
 * et pose `Statut: "Backlog"` ensemble.
 */
export function trierVersBacklog(tache: Tache): Tache {
  return { ...tache, sprint: "", statut: "Backlog" };
}

/**
 * Geste « Planifier dans la semaine » : écrit `Début` (et `Fin` si fournie).
 * Sans `Fin`, une `Fin` résiduelle est effacée (replanification date seule).
 * Rejette une `Fin` sans `Début` (R2).
 */
export function planifierCreneau(tache: Tache, debut: string, fin?: string): Tache {
  if (!debut) {
    throw new Error("planifierCreneau : Début est requis (une Fin sans Début viole R2).");
  }
  const suite: Tache = { ...tache, debut };
  if (fin) {
    suite.fin = fin;
  } else {
    delete suite.fin;
  }
  return suite;
}
