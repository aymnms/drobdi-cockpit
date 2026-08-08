/**
 * Schéma de données v2 (source de vérité : SYSTEME.md §3 / SPEC-scrum-personnel.md §5.3).
 *
 * Le plugin ne possède AUCUNE donnée : ce type est une représentation en mémoire
 * du frontmatter canonique d'un fichier `taches/TD-XXXX.md`. Les noms internes sont
 * en camelCase ; la correspondance avec les clés YAML exactes (accentuées, avec
 * espaces) est centralisée dans `frontmatter.ts` (ordre canonique compris).
 */

/** Statuts du schéma v2. `Reporté`/`Abandonné` sont terminaux (posés par Drobdi, jamais par le plugin). */
export type Statut =
  | "Backlog"
  | "À faire"
  | "En cours"
  | "Terminé"
  | "Reporté"
  | "Abandonné";

export const STATUTS: readonly Statut[] = [
  "Backlog",
  "À faire",
  "En cours",
  "Terminé",
  "Reporté",
  "Abandonné",
];

/** Colonnes du kanban de sprint (statuts hors Backlog). */
export const STATUTS_KANBAN: readonly Statut[] = [
  "À faire",
  "En cours",
  "Terminé",
  "Reporté",
  "Abandonné",
];

export type Priorite = "Vital" | "À traiter" | "Détente" | "Optionnelle";

export const PRIORITES: readonly Priorite[] = [
  "Vital",
  "À traiter",
  "Détente",
  "Optionnelle",
];

export interface Tache {
  /** `Titre` — texte libre. */
  titre: string;
  /** `Projet` — nom interne de la fiche projet (sans les `[[ ]]`), ex. `"Cockpit"`. */
  projet: string;
  /** `Statut`. */
  statut: Statut;
  /** `Priorité`. */
  priorite: Priorite;
  /** `Sprint` — `YYYY-Wxx`, ou `""` si (et seulement si) `statut === "Backlog"`. */
  sprint: string;
  /** `Début` — créneau planifié (optionnel). Date seule ou `YYYY-MM-DDTHH:mm`. */
  debut?: string;
  /** `Fin` — jamais sans `debut` (R2). */
  fin?: string;
  /** `Réalisé le` — date effective de réalisation. */
  realiseLe?: string;
  /** `Récurrente` — id interne d'une récurrente (sans `[[ ]]`), ex. `"REC-01"`. */
  recurrente?: string;
  /** `Reprend` — id interne d'une tâche reportée (sans `[[ ]]`), ex. `"TD-0042"`. */
  reprend?: string;
  /** `Google Calendar` — défaut false ; absent du fichier plutôt que `false`. */
  googleCalendar?: boolean;
  /** `Google Event ID` — géré par Drobdi uniquement, jamais écrit par le plugin, mais préservé. */
  googleEventId?: string;
  /** Corps de la note après le frontmatter (commence par `# <Titre>`, R3). Préservé au caractère près. */
  corps: string;
  /**
   * Clés YAML hors schéma rencontrées à la lecture (garde-fou R1). Absent si aucune.
   * Jamais réécrit par le plugin : le sérialiseur n'émet que les champs canoniques.
   */
  champsInconnus?: Record<string, string>;
}
