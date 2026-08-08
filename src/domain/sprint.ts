/**
 * Fiche sprint (`sprints/Sprint-YYYY-Wxx.md`). Schéma distinct de celui des
 * tâches : frontmatter `Sprint` / `Semaine` / `Statut: En cours|Clos`.
 * Le plugin lit ces fiches (détection du sprint courant) sans jamais les écrire.
 */
export interface FichierSprint {
  /** `Sprint` — identifiant `YYYY-Wxx`. */
  sprint: string;
  /** `Semaine` — libellé humain optionnel. */
  semaine?: string;
  /** `Statut` — `En cours` | `Clos` (ou autre valeur présente dans le fichier). */
  statut: string;
  /** Chemin absolu du fichier sur le disque. */
  chemin: string;
}
