/**
 * Calcul de la semaine ISO 8601 (norme utilisée pour les sprints drobdi).
 *
 * Règle ISO 8601 : la semaine 1 d'une année est celle qui contient son premier
 * jeudi (de façon équivalente, celle qui contient le 4 janvier). Les semaines
 * commencent le lundi. Une année « ISO » peut donc différer de l'année civile
 * aux tout premiers/derniers jours de l'année.
 */

const MS_PAR_SEMAINE = 7 * 24 * 60 * 60 * 1000;

/**
 * Retourne la semaine ISO d'une date au format `YYYY-Wxx` (ex. `2026-W32`).
 * Seule la date civile (année/mois/jour, en heure locale) est prise en compte ;
 * l'heure de la journée n'a aucune influence.
 */
export function semaineISO(date: Date): string {
  // On travaille en UTC sur la date civile locale pour éviter tout décalage de fuseau.
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  // Jour de la semaine avec lundi = 0 … dimanche = 6.
  const jour = (d.getUTCDay() + 6) % 7;

  // On se déplace sur le jeudi de la semaine courante : l'année de ce jeudi
  // est, par définition, l'année ISO ; le numéro de semaine s'en déduit.
  d.setUTCDate(d.getUTCDate() - jour + 3);
  const anneeISO = d.getUTCFullYear();

  // Jeudi de la semaine 1 = jeudi de la semaine contenant le 4 janvier.
  const premierJeudi = new Date(Date.UTC(anneeISO, 0, 4));
  const jourPremierJeudi = (premierJeudi.getUTCDay() + 6) % 7;
  premierJeudi.setUTCDate(premierJeudi.getUTCDate() - jourPremierJeudi + 3);

  const numero =
    1 + Math.round((d.getTime() - premierJeudi.getTime()) / MS_PAR_SEMAINE);

  return `${anneeISO}-W${String(numero).padStart(2, "0")}`;
}

/**
 * Sprint courant = semaine ISO de l'instant donné. Wrapper métier explicite
 * (le vocabulaire du système drobdi parle de « sprint », pas de « semaine ISO »).
 */
export function sprintCourant(maintenant: Date): string {
  return semaineISO(maintenant);
}
