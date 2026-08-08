import { describe, expect, it } from "vitest";
import { construireCockpit } from "../../src/domain/cockpit";
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

describe("construireCockpit", () => {
  const taches = [
    t({ titre: "A", statut: "À faire", sprint: "2026-W32" }),
    t({ titre: "B", statut: "En cours", sprint: "2026-W32" }),
    t({ titre: "C", statut: "Terminé", sprint: "2026-W32" }),
    t({ titre: "D", statut: "À faire", sprint: "2026-W31" }), // autre sprint
    t({ titre: "E", statut: "Backlog", sprint: "", priorite: "Détente" }),
    t({ titre: "F", statut: "Backlog", sprint: "", priorite: "Vital" }),
  ];

  it("ne garde dans le sprint que les tâches du sprint courant (hors Backlog)", () => {
    const c = construireCockpit(taches, "2026-W32");
    expect(c.tachesSprint.map((x) => x.titre).sort()).toEqual(["A", "B", "C"]);
  });

  it("regroupe les tâches du sprint par statut (colonnes kanban)", () => {
    const c = construireCockpit(taches, "2026-W32");
    expect(c.parStatut["À faire"].map((x) => x.titre)).toEqual(["A"]);
    expect(c.parStatut["En cours"].map((x) => x.titre)).toEqual(["B"]);
    expect(c.parStatut["Terminé"].map((x) => x.titre)).toEqual(["C"]);
    expect(c.parStatut["Reporté"]).toEqual([]);
  });

  it("place les Backlog à part, triées par priorité (Vital d'abord)", () => {
    const c = construireCockpit(taches, "2026-W32");
    expect(c.backlog.map((x) => x.titre)).toEqual(["F", "E"]);
  });

  it("expose le sprintId courant", () => {
    expect(construireCockpit(taches, "2026-W32").sprintId).toBe("2026-W32");
  });
});
