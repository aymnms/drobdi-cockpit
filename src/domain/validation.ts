import { PRIORITES, STATUTS, type Tache } from "./tache";

/** Une violation du schéma v2, rattachée au champ fautif. */
export interface ErreurValidation {
  /** Clé YAML (ou nom de champ inconnu) concernée. */
  champ: string;
  message: string;
}

const RE_SPRINT = /^\d{4}-W\d{2}$/;
const RE_TD = /^TD-\d{4,}$/;
const RE_REC = /^REC-\d{2,}$/;

/**
 * Valide une `Tache` au regard du schéma v2. Retourne la liste (vide si tout va
 * bien) des violations. Couvre :
 *  - R1 : champs hors schéma (`champsInconnus`) ;
 *  - R2 : `Fin` interdit sans `Début` ;
 *  - R4 : format des identifiants référencés (`Reprend` → TD-XXXX, `Récurrente` → REC-XX) ;
 *  - domaines de valeurs `Statut`/`Priorité` ;
 *  - présence des champs obligatoires ;
 *  - invariant sprint : « 1 tâche = 1 sprint » (Sprint vide ⟺ Backlog).
 */
export function validerSchema(tache: Tache): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  const ajoute = (champ: string, message: string) => erreurs.push({ champ, message });

  // R1 — aucun champ hors schéma.
  for (const cle of Object.keys(tache.champsInconnus ?? {})) {
    ajoute(cle, `Champ « ${cle} » hors schéma v2 (R1).`);
  }

  // Champs obligatoires présents.
  if (!tache.titre) ajoute("Titre", "Titre obligatoire.");
  if (!tache.projet) ajoute("Projet", "Projet obligatoire (wikilink vers une fiche projet).");

  // Domaines de valeurs.
  if (!STATUTS.includes(tache.statut)) {
    ajoute("Statut", `Statut « ${tache.statut} » hors du domaine autorisé.`);
  }
  if (!PRIORITES.includes(tache.priorite)) {
    ajoute("Priorité", `Priorité « ${tache.priorite} » hors du domaine autorisé.`);
  }

  // Invariant sprint : Sprint vide si et seulement si Backlog.
  if (tache.statut === "Backlog") {
    if (tache.sprint !== "") {
      ajoute("Sprint", "Une tâche Backlog doit avoir un Sprint vide.");
    }
  } else {
    if (!RE_SPRINT.test(tache.sprint)) {
      ajoute("Sprint", "Hors Backlog, Sprint doit être renseigné au format YYYY-Wxx.");
    }
  }

  // R2 — Fin exige Début.
  if (tache.fin && !tache.debut) {
    ajoute("Fin", "Fin ne peut exister sans Début (R2).");
  }

  // R4 — format des identifiants référencés.
  if (tache.reprend !== undefined && !RE_TD.test(tache.reprend)) {
    ajoute("Reprend", "Reprend doit référencer un identifiant TD-XXXX (R4).");
  }
  if (tache.recurrente !== undefined && !RE_REC.test(tache.recurrente)) {
    ajoute("Récurrente", "Récurrente doit référencer un identifiant REC-XX.");
  }

  return erreurs;
}
