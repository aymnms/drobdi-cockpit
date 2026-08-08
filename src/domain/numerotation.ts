/**
 * Numérotation des tâches (R4) : `TD-` + au moins 4 chiffres, croissante,
 * jamais réutilisée, jamais un trou comblé. Le prochain numéro est toujours
 * `max(existants) + 1` — pas le premier libre.
 */

/** Extrait la partie numérique d'une entrée (`"TD-0042"` ou `"0042"`). */
function numeroDe(entree: string): number {
  const m = /(\d+)\s*$/.exec(entree.trim());
  return m ? Number.parseInt(m[1], 10) : 0;
}

/**
 * Retourne le prochain identifiant `TD-XXXX` (padding minimal 4 chiffres) à
 * partir de la liste des numéros existants (préfixés ou bruts).
 */
export function prochainNumeroTD(numerosExistants: string[]): string {
  const max = numerosExistants.reduce((acc, e) => Math.max(acc, numeroDe(e)), 0);
  return `TD-${String(max + 1).padStart(4, "0")}`;
}
