import { prochainNumeroTD } from "./numerotation";
import type { Tache } from "./tache";

/** Résultat de `creerTache` : la tâche et son identifiant (= futur nom de fichier). */
export interface NouvelleTache {
  /** Identifiant `TD-XXXX` — sert de nom de fichier `taches/TD-XXXX.md`. N'est PAS un champ du frontmatter. */
  id: string;
  tache: Tache;
}

/**
 * Geste « Capturer une idée » : crée une tâche `Backlog` au frontmatter canonique
 * complet, numérotée via `prochainNumeroTD` (R4). Le corps démarre par `# <Titre>`
 * (R3). Le projet est optionnel (capture rapide) — un projet vide est toléré et
 * sera signalé par `validerSchema` au moment du tri, pas ici.
 */
export function creerTache(
  titre: string,
  projet: string,
  numerosExistants: string[],
): NouvelleTache {
  const id = prochainNumeroTD(numerosExistants);
  const tache: Tache = {
    titre,
    projet,
    statut: "Backlog",
    priorite: "À traiter",
    sprint: "",
    corps: `\n# ${titre}\n`,
  };
  return { id, tache };
}
