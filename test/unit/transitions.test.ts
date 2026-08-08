import { describe, expect, it } from "vitest";
import type { Tache } from "../../src/domain/tache";
import {
  avancerStatut,
  planifierCreneau,
  trierVersBacklog,
  trierVersSprint,
} from "../../src/domain/transitions";

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

describe("avancerStatut", () => {
  it("change le statut sans rien toucher d'autre", () => {
    const t = base();
    const r = avancerStatut(t, "En cours", new Date(2026, 7, 8));
    expect(r.statut).toBe("En cours");
    expect(r.realiseLe).toBeUndefined();
    expect(t.statut).toBe("À faire"); // immuable : l'entrée n'est pas mutée
  });

  it("ajoute Réalisé le (aujourd'hui, YYYY-MM-DD) en passant à Terminé", () => {
    const r = avancerStatut(base(), "Terminé", new Date(2026, 7, 8));
    expect(r.statut).toBe("Terminé");
    expect(r.realiseLe).toBe("2026-08-08");
  });

  it("préserve le reste des champs et le corps", () => {
    const r = avancerStatut(base({ debut: "2026-08-08T09:00" }), "En cours", new Date(2026, 7, 8));
    expect(r.debut).toBe("2026-08-08T09:00");
    expect(r.corps).toBe("\n# Tâche\n");
  });
});

describe("trierVersSprint / trierVersBacklog (transitions atomiques)", () => {
  it("entrée en sprint : pose Sprint + Statut À faire ensemble", () => {
    const t = base({ statut: "Backlog", sprint: "" });
    const r = trierVersSprint(t, "2026-W32");
    expect(r.sprint).toBe("2026-W32");
    expect(r.statut).toBe("À faire");
  });

  it("sortie vers backlog : vide Sprint + pose Statut Backlog ensemble", () => {
    const r = trierVersBacklog(base({ statut: "En cours", sprint: "2026-W32" }));
    expect(r.sprint).toBe("");
    expect(r.statut).toBe("Backlog");
  });
});

describe("planifierCreneau", () => {
  it("écrit Début seul (badge jour sans heure)", () => {
    const r = planifierCreneau(base(), "2026-08-05");
    expect(r.debut).toBe("2026-08-05");
    expect(r.fin).toBeUndefined();
  });

  it("écrit Début et Fin quand une plage est fournie", () => {
    const r = planifierCreneau(base(), "2026-08-05T09:00", "2026-08-05T09:30");
    expect(r.debut).toBe("2026-08-05T09:00");
    expect(r.fin).toBe("2026-08-05T09:30");
  });

  it("efface une Fin résiduelle si on replanifie sans heure", () => {
    const r = planifierCreneau(base({ debut: "x", fin: "2026-08-01T10:00" }), "2026-08-05");
    expect(r.fin).toBeUndefined();
  });

  it("refuse une Fin sans Début (R2)", () => {
    expect(() => planifierCreneau(base(), "", "2026-08-05T09:30")).toThrow();
  });
});
