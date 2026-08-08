import type { Priorite } from "../domain/tache";

/**
 * Helpers de formatage pour l'affichage (purs, sans DOM ni Obsidian → testables
 * en unitaire). Utilisés par le rendu des cartes et badges du cockpit.
 */

const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/**
 * Couleur déterministe dérivée du nom de projet (teinte HSL stable). Sert au
 * badge projet coloré. Deux noms distincts donnent (presque toujours) deux
 * teintes distinctes ; le même nom donne toujours la même couleur.
 */
export function couleurProjet(nom: string): string {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = (hash * 31 + nom.charCodeAt(i)) % 360;
  }
  const teinte = ((hash % 360) + 360) % 360;
  return `hsl(${teinte} 55% 45%)`;
}

/** Date `YYYY-MM-DD[THH:mm]` → badge « jourCourt numéro » (ex. `"mar. 4"`). */
export function badgeJour(debut: string): string {
  const [y, m, d] = debut.slice(0, 10).split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${JOURS_COURTS[date.getDay()]} ${d}`;
}

/** Heure `HH:mm` si `debut` porte une heure, sinon `null` (journée entière). */
export function heureDebut(debut: string): string | null {
  const m = /T(\d{2}:\d{2})/.exec(debut);
  return m ? m[1] : null;
}

/** Suffixe de classe CSS stable (sans accent/espace) pour une priorité. */
export function slugPriorite(priorite: Priorite): string {
  return priorite
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}
