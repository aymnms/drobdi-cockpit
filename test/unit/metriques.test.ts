import { describe, expect, it } from "vitest";
import { pointsBurndown, tauxRealisation } from "../../src/domain/metriques";
import type { Tache } from "../../src/domain/tache";

function t(over: Partial<Tache>): Tache {
  return {
    titre: "T",
    projet: "P",
    statut: "À faire",
    priorite: "À traiter",
    sprint: "2026-W32",
    corps: "\n# T\n",
    ...over,
  };
}

describe("tauxRealisation", () => {
  it("retourne Terminé / engagées", () => {
    const taches = [t({ statut: "Terminé" }), t({ statut: "En cours" }), t({ statut: "À faire" })];
    expect(tauxRealisation(taches)).toBeCloseTo(1 / 3);
  });

  it("retourne 0 pour un sprint vide (pas de NaN)", () => {
    expect(tauxRealisation([])).toBe(0);
  });

  it("retourne 1 quand tout est terminé", () => {
    expect(tauxRealisation([t({ statut: "Terminé" }), t({ statut: "Terminé" })])).toBe(1);
  });
});

describe("pointsBurndown", () => {
  const semaine = { debut: new Date(2026, 7, 3), fin: new Date(2026, 7, 9) }; // lun→dim

  it("reconstitue les tâches restantes par jour depuis Réalisé le", () => {
    const taches = [
      t({ statut: "Terminé", realiseLe: "2026-08-04" }),
      t({ statut: "Terminé", realiseLe: "2026-08-04" }),
      t({ statut: "Terminé", realiseLe: "2026-08-06" }),
      t({ statut: "En cours" }), // jamais terminée
    ];
    const pts = pointsBurndown(taches, semaine);
    expect(pts).toHaveLength(7);
    expect(pts.map((p) => p.restantes)).toEqual([4, 2, 2, 1, 1, 1, 1]);
    expect(pts[0].jour.getDate()).toBe(3);
    expect(pts[6].jour.getDate()).toBe(9);
  });

  it("part du total engagé le premier jour et n'est jamais négatif", () => {
    const taches = [t({ statut: "Terminé", realiseLe: "2026-08-03" })];
    const pts = pointsBurndown(taches, semaine);
    expect(pts[0].restantes).toBe(0); // terminée dès le lundi
    expect(Math.min(...pts.map((p) => p.restantes))).toBeGreaterThanOrEqual(0);
  });

  it("ignore une tâche Terminé sans Réalisé le (non plaçable)", () => {
    const pts = pointsBurndown([t({ statut: "Terminé" })], semaine);
    expect(pts.every((p) => p.restantes === 1)).toBe(true);
  });
});
