import type { Priorite } from "../domain/tache";

/**
 * Helpers de formatage pour l'affichage (purs, sans DOM ni Obsidian → testables
 * en unitaire). Utilisés par le rendu des cartes et badges du cockpit.
 */

const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/**
 * Couleur déterministe dérivée du nom de projet (teinte HSL stable). Sert au
 * badge projet coloré et à l'accent des cartes. La teinte est répartie via
 * l'angle d'or (~137,5°) pour maximiser l'écart visuel entre projets proches ;
 * saturation/luminosité fixes garantissent un contraste correct du texte blanc.
 * Même nom → même couleur ; deux noms distincts → (quasi toujours) deux teintes.
 */
export function couleurProjet(nom: string): string {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = (hash * 31 + nom.charCodeAt(i)) | 0; // int 32 bits signé
  }
  const teinte = Math.round((Math.abs(hash) * 137.508) % 360);
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
