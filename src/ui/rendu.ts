import type { CockpitData } from "../domain/cockpit";
import type { PointBurndown } from "../domain/metriques";
import type { FichierSprint } from "../domain/sprint";
import { STATUTS_KANBAN, type Statut, type Tache } from "../domain/tache";
import { badgeJour, couleurProjet, heureDebut, slugPriorite } from "./format";

/**
 * Rendu DOM du cockpit. Volontairement écrit avec l'API DOM standard
 * (`document.createElement`, classes CSS, événements HTML5 drag) plutôt qu'avec
 * les helpers Obsidian : cela le rend testable sous jsdom tout en fonctionnant
 * tel quel dans Obsidian (`contentEl` est un vrai `HTMLElement`). Aucune I/O ici :
 * les gestes délèguent aux callbacks `ActionsCockpit`, la vue fait l'écriture.
 */

/** Tâche telle qu'affichée : frontmatter + identité fichier (pour ouvrir/écrire). */
export type TacheAffichee = Tache & { id: string; chemin: string };

/** Callbacks branchés par la vue (les gestes d'écriture). */
export interface ActionsCockpit {
  onOuvrir?(t: TacheAffichee): void;
  /** Avancer une tâche du sprint vers un autre statut (drag entre colonnes). */
  onAvancer?(t: TacheAffichee, cible: Statut): void;
  /** Faire entrer une tâche Backlog dans le sprint courant (drag backlog → kanban). */
  onEntrerSprint?(t: TacheAffichee): void;
  /** Sortir une tâche du sprint vers le Backlog (drag kanban → backlog). */
  onSortirSprint?(t: TacheAffichee): void;
  /** Ouvrir le sélecteur de planification, ancré sur le badge cliqué. */
  onPlanifier?(t: TacheAffichee, ancre: HTMLElement): void;
}

/** Contexte de glisser-déposer partagé entre le kanban et le backlog. */
interface ContexteDnD {
  source: { t: TacheAffichee; origine: "kanban" | "backlog" } | null;
}

interface DonneesBandeau {
  sprintId: string;
  taux: number;
  burndown: PointBurndown[];
  ficheSprint: FichierSprint | null;
}

function doc(parent: HTMLElement): Document {
  return parent.ownerDocument;
}

function el<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  classe?: string,
  texte?: string,
): HTMLElementTagNameMap[K] {
  const node = doc(parent).createElement(tag);
  if (classe) node.className = classe;
  if (texte !== undefined) node.textContent = texte;
  parent.appendChild(node);
  return node;
}

/* ============================ Bandeau ============================ */

/** Bandeau métriques : jauge de réalisation + courbe de burndown (SVG). */
export function rendreBandeau(parent: HTMLElement, d: DonneesBandeau): HTMLElement {
  const bandeau = el(parent, "div", "drobdi-bandeau");

  const entete = el(bandeau, "div", "drobdi-bandeau-entete");
  el(entete, "span", "drobdi-sprint-id", `Sprint ${d.sprintId}`);
  el(
    entete,
    "span",
    "drobdi-sprint-statut",
    d.ficheSprint ? d.ficheSprint.statut : "aucune fiche sprint",
  );

  const pct = Math.round(d.taux * 100);
  const jauge = el(bandeau, "div", "drobdi-jauge");
  const fill = el(jauge, "div", "drobdi-jauge-fill");
  fill.style.width = `${pct}%`;
  el(jauge, "span", "drobdi-jauge-label", `${pct} %`);

  rendreBurndown(bandeau, d.burndown);
  return bandeau;
}

function rendreBurndown(parent: HTMLElement, pts: PointBurndown[]): void {
  const NS = "http://www.w3.org/2000/svg";
  const W = 100;
  const H = 40;
  const svg = doc(parent).createElementNS(NS, "svg");
  svg.setAttribute("class", "drobdi-burndown");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");

  if (pts.length > 0) {
    const max = Math.max(1, ...pts.map((p) => p.restantes));
    const pas = pts.length > 1 ? W / (pts.length - 1) : 0;
    const coords = pts.map((p, i) => {
      const x = Math.round(i * pas * 100) / 100;
      const y = Math.round((H - (p.restantes / max) * H) * 100) / 100;
      return `${x},${y}`;
    });

    const poly = doc(parent).createElementNS(NS, "polyline");
    poly.setAttribute("class", "drobdi-burndown-ligne");
    poly.setAttribute("points", coords.join(" "));
    svg.appendChild(poly);

    for (const c of coords) {
      const [x, y] = c.split(",");
      const pt = doc(parent).createElementNS(NS, "circle");
      pt.setAttribute("cx", x);
      pt.setAttribute("cy", y);
      pt.setAttribute("r", "1.5");
      pt.setAttribute("class", "drobdi-burndown-point");
      svg.appendChild(pt);
    }
  }
  parent.appendChild(svg);
}

/* ============================ Cartes ============================ */

/** Carte de tâche (partagée kanban + backlog) : titre, badge projet, pastille priorité, badge jour. */
function creerCarte(
  parent: HTMLElement,
  t: TacheAffichee,
  actions: ActionsCockpit | undefined,
  ctx: ContexteDnD,
  origine: "kanban" | "backlog",
): HTMLElement {
  const carte = el(parent, "article", "drobdi-carte");
  carte.dataset.td = t.id;
  carte.draggable = true;

  // Accent couleur de la carte = couleur du projet (J6-1), via variable CSS.
  if (t.projet) {
    carte.style.setProperty("--drobdi-accent", couleurProjet(t.projet));
    carte.classList.add("has-accent");
  }

  el(carte, "div", "drobdi-carte-titre", t.titre);

  const meta = el(carte, "div", "drobdi-carte-meta");
  if (t.projet) {
    const badge = el(meta, "span", "drobdi-badge-projet", t.projet);
    badge.style.backgroundColor = couleurProjet(t.projet);
  }
  const pastille = el(meta, "span", `drobdi-pastille drobdi-pastille-${slugPriorite(t.priorite)}`);
  pastille.title = `Priorité : ${t.priorite}`;
  pastille.setAttribute("aria-label", `Priorité : ${t.priorite}`);

  // Badge jour : toujours présent (affordance de planification, geste J5-4).
  const heure = t.debut ? heureDebut(t.debut) : null;
  const badge = el(
    meta,
    "span",
    t.debut ? "drobdi-badge-jour" : "drobdi-badge-jour is-vide",
    t.debut ? (heure ? `${badgeJour(t.debut)} · ${heure}` : badgeJour(t.debut)) : "planifier",
  );
  badge.addEventListener("click", (e) => {
    e.stopPropagation(); // ne pas ouvrir la note
    actions?.onPlanifier?.(t, badge);
  });

  // Glisser-déposer (source).
  carte.addEventListener("dragstart", (e) => {
    ctx.source = { t, origine };
    carte.classList.add("is-drag");
    const dt = (e as DragEvent).dataTransfer;
    if (dt) {
      dt.effectAllowed = "move";
      dt.setData("text/plain", t.id);
    }
  });
  carte.addEventListener("dragend", () => {
    carte.classList.remove("is-drag");
    ctx.source = null;
  });

  if (actions?.onOuvrir) {
    carte.addEventListener("click", () => actions.onOuvrir?.(t));
  }
  return carte;
}

/** Marque un élément comme zone de dépôt et branche le traitement du drop. */
function zoneDepot(zone: HTMLElement, surDepot: (source: ContexteDnD["source"]) => void, ctx: ContexteDnD): void {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dt = (e as DragEvent).dataTransfer;
    if (dt) dt.dropEffect = "move";
    zone.classList.add("is-cible");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-cible"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-cible");
    surDepot(ctx.source);
    ctx.source = null;
  });
}

/* ============================ Kanban ============================ */

/** Kanban du sprint : une colonne par statut (hors Backlog). */
export function rendreKanban<T extends TacheAffichee>(
  parent: HTMLElement,
  cockpit: CockpitData<T>,
  actions?: ActionsCockpit,
  ctx: ContexteDnD = { source: null },
): HTMLElement {
  const kanban = el(parent, "div", "drobdi-kanban");
  for (const statut of STATUTS_KANBAN) {
    const colonne = el(kanban, "section", "drobdi-colonne");
    colonne.dataset.statut = statut;

    const entete = el(colonne, "header", "drobdi-colonne-titre");
    entete.appendChild(doc(parent).createTextNode(statut));
    el(entete, "span", "drobdi-colonne-compte", String(cockpit.parStatut[statut].length));

    const cartes = el(colonne, "div", "drobdi-colonne-cartes");
    for (const t of cockpit.parStatut[statut]) {
      creerCarte(cartes, t, actions, ctx, "kanban");
    }

    // Dépôt : depuis le backlog → entrée sprint ; depuis le kanban → avancer.
    zoneDepot(
      colonne,
      (source) => {
        if (!source) return;
        if (source.origine === "backlog") {
          actions?.onEntrerSprint?.(source.t);
        } else if (source.t.statut !== statut) {
          actions?.onAvancer?.(source.t, statut);
        }
      },
      ctx,
    );
  }
  return kanban;
}

/* ============================ Backlog ============================ */

/** Panneau backlog latéral repliable, trié par priorité. */
export function rendreBacklog<T extends TacheAffichee>(
  parent: HTMLElement,
  backlog: T[],
  actions?: ActionsCockpit,
  ctx: ContexteDnD = { source: null },
): HTMLElement {
  const aside = el(parent, "aside", "drobdi-backlog");

  const entete = el(aside, "header", "drobdi-backlog-titre");
  entete.setAttribute("role", "button");
  entete.tabIndex = 0;
  el(entete, "span", "drobdi-backlog-libelle", `Backlog (${backlog.length})`);
  const chevron = el(entete, "span", "drobdi-backlog-chevron", "▾");
  chevron.setAttribute("aria-hidden", "true");

  const cartes = el(aside, "div", "drobdi-backlog-cartes");
  for (const t of backlog) {
    creerCarte(cartes, t, actions, ctx, "backlog");
  }

  entete.addEventListener("click", () => aside.classList.toggle("is-replie"));

  // Dépôt : depuis le kanban → sortie vers le backlog.
  zoneDepot(
    aside,
    (source) => {
      if (source?.origine === "kanban") actions?.onSortirSprint?.(source.t);
    },
    ctx,
  );
  return aside;
}

/* ============================ Composition ============================ */

interface EtatRendu<T extends TacheAffichee> {
  cockpit: CockpitData<T>;
  taux: number;
  burndown: PointBurndown[];
  ficheSprint: FichierSprint | null;
}

/** Compose le cockpit complet dans `parent` (vidé au préalable). */
export function rendreCockpit<T extends TacheAffichee>(
  parent: HTMLElement,
  etat: EtatRendu<T>,
  actions?: ActionsCockpit,
): void {
  parent.replaceChildren();
  parent.classList.add("drobdi-cockpit");

  // Contexte de drag partagé entre kanban et backlog (permet les gestes croisés).
  const ctx: ContexteDnD = { source: null };

  const principal = el(parent, "div", "drobdi-principal");
  rendreBandeau(principal, {
    sprintId: etat.cockpit.sprintId,
    taux: etat.taux,
    burndown: etat.burndown,
    ficheSprint: etat.ficheSprint,
  });
  rendreKanban(principal, etat.cockpit, actions, ctx);

  rendreBacklog(parent, etat.cockpit.backlog, actions, ctx);
}
