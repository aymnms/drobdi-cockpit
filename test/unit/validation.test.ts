import { describe, expect, it } from "vitest";
import type { Tache } from "../../src/domain/tache";
import { validerSchema } from "../../src/domain/validation";

function base(over: Partial<Tache> = {}): Tache {
  return {
    titre: "Tâche",
    projet: "Cockpit",
    statut: "À faire",
    priorite: "À traiter",
    sprint: "2026-W32",
    corps: "\n# Tâche\n",
    ...over,
  };
}

const champs = (over: Partial<Tache>) => validerSchema(base(over)).map((e) => e.champ);

describe("validerSchema", () => {
  it("ne retourne aucune erreur pour une tâche valide (sprint)", () => {
    expect(validerSchema(base())).toEqual([]);
  });

  it("ne retourne aucune erreur pour un Backlog valide (Sprint vide)", () => {
    expect(validerSchema(base({ statut: "Backlog", sprint: "" }))).toEqual([]);
  });

  it("R2 : Fin sans Début est une erreur", () => {
    expect(champs({ fin: "2026-08-03T09:30" })).toContain("Fin");
    expect(validerSchema(base({ debut: "2026-08-03T09:00", fin: "2026-08-03T09:30" }))).toEqual([]);
  });

  it("R1 : un champ hors schéma est signalé", () => {
    const erreurs = validerSchema(base({ champsInconnus: { Estimation: "3" } }));
    expect(erreurs.some((e) => e.champ === "Estimation")).toBe(true);
  });

  it("signale un Statut hors domaine", () => {
    expect(champs({ statut: "Fait" as Tache["statut"] })).toContain("Statut");
  });

  it("signale une Priorité hors domaine", () => {
    expect(champs({ priorite: "Haute" as Tache["priorite"] })).toContain("Priorité");
  });

  it("impose Sprint non vide (et bien formé) hors Backlog", () => {
    expect(champs({ statut: "En cours", sprint: "" })).toContain("Sprint");
    expect(champs({ statut: "En cours", sprint: "2026-32" })).toContain("Sprint");
  });

  it("impose Sprint vide pour un Backlog", () => {
    expect(champs({ statut: "Backlog", sprint: "2026-W32" })).toContain("Sprint");
  });

  it("R4 : Reprend doit être un identifiant TD-XXXX", () => {
    expect(champs({ reprend: "TD-42" })).toContain("Reprend");
    expect(validerSchema(base({ reprend: "TD-0042" }))).toEqual([]);
  });

  it("Récurrente doit être un identifiant REC-XX", () => {
    expect(champs({ recurrente: "R1" })).toContain("Récurrente");
    expect(validerSchema(base({ recurrente: "REC-01" }))).toEqual([]);
  });

  it("signale les champs obligatoires vides", () => {
    expect(champs({ titre: "" })).toContain("Titre");
    expect(champs({ projet: "" })).toContain("Projet");
  });
});
