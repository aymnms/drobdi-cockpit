// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { construireCockpit } from "../../src/domain/cockpit";
import { pointsBurndown, tauxRealisation } from "../../src/domain/metriques";
import type { Tache } from "../../src/domain/tache";
import { rendreBacklog, rendreBandeau, rendreCockpit, rendreKanban } from "../../src/ui/rendu";

function tv(over: Partial<Tache> & { id: string }): Tache & { id: string; chemin: string } {
  return {
    titre: "T",
    projet: "Cockpit",
    statut: "À faire",
    priorite: "À traiter",
    sprint: "2026-W32",
    corps: "\n# T\n",
    chemin: `/vault/taches/${over.id}.md`,
    ...over,
  };
}

const TACHES = [
  tv({ id: "TD-0001", titre: "Spec", statut: "En cours", debut: "2026-08-04T09:00" }),
  tv({ id: "TD-0002", titre: "Palette", statut: "À faire" }),
  tv({ id: "TD-0003", titre: "Setup", statut: "Terminé", realiseLe: "2026-08-05" }),
  tv({ id: "TD-0009", titre: "Idée A", statut: "Backlog", sprint: "", priorite: "Vital" }),
  tv({ id: "TD-0010", titre: "Idée B", statut: "Backlog", sprint: "", priorite: "Détente" }),
];

let root: HTMLElement;
beforeEach(() => {
  root = document.createElement("div");
});

describe("rendreBandeau", () => {
  it("affiche la jauge en pourcentage et une courbe burndown à 7 points", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const taux = tauxRealisation(cockpit.tachesSprint);
    const burndown = pointsBurndown(cockpit.tachesSprint, {
      debut: new Date(2026, 7, 3),
      fin: new Date(2026, 7, 9),
    });
    rendreBandeau(root, { sprintId: "2026-W32", taux, burndown, ficheSprint: null });

    expect(root.querySelector(".drobdi-jauge-label")?.textContent).toBe("33 %"); // 1/3
    const poly = root.querySelector("polyline");
    expect(poly).not.toBeNull();
    expect(poly?.getAttribute("points")?.trim().split(/\s+/)).toHaveLength(7);
  });
});

describe("rendreKanban", () => {
  it("crée une colonne par statut de sprint avec le bon compte", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    rendreKanban(root, cockpit);
    const colonnes = root.querySelectorAll(".drobdi-colonne");
    expect(colonnes).toHaveLength(5); // À faire, En cours, Terminé, Reporté, Abandonné
    const enCours = root.querySelector('[data-statut="En cours"]');
    expect(enCours?.querySelectorAll(".drobdi-carte")).toHaveLength(1);
  });

  it("rend des cartes équilibrées : titre, badge projet, pastille priorité, badge jour", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    rendreKanban(root, cockpit);
    const carte = root.querySelector('.drobdi-carte[data-td="TD-0001"]');
    expect(carte?.querySelector(".drobdi-carte-titre")?.textContent).toBe("Spec");
    expect(carte?.querySelector(".drobdi-badge-projet")?.textContent).toBe("Cockpit");
    expect(carte?.querySelector(".drobdi-pastille")).not.toBeNull();
    expect(carte?.querySelector(".drobdi-badge-jour")?.textContent).toContain("mar. 4");
  });

  it("applique un accent couleur projet et un libellé de priorité accessible (J6-1/J6-2)", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    rendreKanban(root, cockpit);
    const carte = root.querySelector('.drobdi-carte[data-td="TD-0001"]') as HTMLElement;
    expect(carte.classList.contains("has-accent")).toBe(true);
    expect(carte.style.getPropertyValue("--drobdi-accent")).toMatch(/^hsl\(/);
    const pastille = carte.querySelector(".drobdi-pastille") as HTMLElement;
    expect(pastille.getAttribute("aria-label")).toContain("Priorité");
  });

  it("appelle onOuvrir au clic sur une carte", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const onOuvrir = vi.fn();
    rendreKanban(root, cockpit, { onOuvrir });
    (root.querySelector('.drobdi-carte[data-td="TD-0002"]') as HTMLElement).click();
    expect(onOuvrir).toHaveBeenCalledOnce();
    expect(onOuvrir.mock.calls[0][0].id).toBe("TD-0002");
  });
});

describe("rendreBacklog", () => {
  it("liste les tâches backlog triées par priorité et se replie au clic", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    rendreBacklog(root, cockpit.backlog);
    const titres = [...root.querySelectorAll(".drobdi-backlog .drobdi-carte-titre")].map(
      (e) => e.textContent,
    );
    expect(titres).toEqual(["Idée A", "Idée B"]); // Vital avant Détente

    const aside = root.querySelector(".drobdi-backlog") as HTMLElement;
    const entete = root.querySelector(".drobdi-backlog-titre") as HTMLElement;
    expect(aside.classList.contains("is-replie")).toBe(false);
    entete.click();
    expect(aside.classList.contains("is-replie")).toBe(true);
  });
});

describe("gestes drag & drop", () => {
  const drag = (source: Element, cible: Element) => {
    source.dispatchEvent(new Event("dragstart", { bubbles: true }));
    cible.dispatchEvent(new Event("drop", { bubbles: true }));
  };

  it("J5-1 : glisser une carte vers une autre colonne appelle onAvancer(t, statutCible)", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const onAvancer = vi.fn();
    const ctx = { source: null };
    rendreKanban(root, cockpit, { onAvancer }, ctx);

    drag(
      root.querySelector('[data-td="TD-0002"]') as Element, // À faire
      root.querySelector('[data-statut="En cours"]') as Element,
    );
    expect(onAvancer).toHaveBeenCalledOnce();
    expect(onAvancer.mock.calls[0][0].id).toBe("TD-0002");
    expect(onAvancer.mock.calls[0][1]).toBe("En cours");
  });

  it("J5-1 : déposer dans la même colonne ne déclenche rien", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const onAvancer = vi.fn();
    const ctx = { source: null };
    rendreKanban(root, cockpit, { onAvancer }, ctx);
    drag(
      root.querySelector('[data-td="TD-0002"]') as Element,
      root.querySelector('[data-statut="À faire"]') as Element,
    );
    expect(onAvancer).not.toHaveBeenCalled();
  });

  it("J5-2 : backlog → kanban appelle onEntrerSprint ; kanban → backlog appelle onSortirSprint", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const onEntrerSprint = vi.fn();
    const onSortirSprint = vi.fn();
    const ctx = { source: null };
    rendreKanban(root, cockpit, { onEntrerSprint, onSortirSprint }, ctx);
    rendreBacklog(root, cockpit.backlog, { onEntrerSprint, onSortirSprint }, ctx);

    drag(
      root.querySelector('.drobdi-backlog [data-td="TD-0009"]') as Element,
      root.querySelector('[data-statut="À faire"]') as Element,
    );
    expect(onEntrerSprint).toHaveBeenCalledOnce();
    expect(onEntrerSprint.mock.calls[0][0].id).toBe("TD-0009");

    drag(
      root.querySelector('.drobdi-kanban [data-td="TD-0001"]') as Element,
      root.querySelector(".drobdi-backlog") as Element,
    );
    expect(onSortirSprint).toHaveBeenCalledOnce();
    expect(onSortirSprint.mock.calls[0][0].id).toBe("TD-0001");
  });
});

describe("geste planifier (J5-4)", () => {
  it("clic sur le badge jour appelle onPlanifier sans ouvrir la note", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    const onPlanifier = vi.fn();
    const onOuvrir = vi.fn();
    rendreKanban(root, cockpit, { onPlanifier, onOuvrir });
    const badge = root.querySelector('[data-td="TD-0002"] .drobdi-badge-jour') as HTMLElement;
    badge.click();
    expect(onPlanifier).toHaveBeenCalledOnce();
    expect(onPlanifier.mock.calls[0][0].id).toBe("TD-0002");
    expect(onOuvrir).not.toHaveBeenCalled();
  });
});

describe("rendreCockpit", () => {
  it("compose bandeau + kanban + backlog dans le conteneur", () => {
    const cockpit = construireCockpit(TACHES, "2026-W32");
    rendreCockpit(root, {
      cockpit,
      taux: tauxRealisation(cockpit.tachesSprint),
      burndown: pointsBurndown(cockpit.tachesSprint, {
        debut: new Date(2026, 7, 3),
        fin: new Date(2026, 7, 9),
      }),
      ficheSprint: null,
    });
    expect(root.querySelector(".drobdi-bandeau")).not.toBeNull();
    expect(root.querySelector(".drobdi-kanban")).not.toBeNull();
    expect(root.querySelector(".drobdi-backlog")).not.toBeNull();
  });
});
