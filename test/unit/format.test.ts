import { describe, expect, it } from "vitest";
import {
  badgeJour,
  couleurProjet,
  heureDebut,
  slugPriorite,
} from "../../src/ui/format";

describe("couleurProjet", () => {
  it("est déterministe pour un même nom", () => {
    expect(couleurProjet("Cockpit")).toBe(couleurProjet("Cockpit"));
  });

  it("renvoie une couleur HSL exploitable en CSS", () => {
    expect(couleurProjet("Cockpit")).toMatch(/^hsl\(/);
  });

  it("distingue (en général) deux noms différents", () => {
    expect(couleurProjet("Cockpit")).not.toBe(couleurProjet("Maison"));
  });

  it("gère le nom vide sans planter", () => {
    expect(couleurProjet("")).toMatch(/^hsl\(/);
  });
});

describe("badgeJour", () => {
  it("affiche le jour court FR + numéro du jour", () => {
    // 2026-08-04 est un mardi
    expect(badgeJour("2026-08-04")).toBe("mar. 4");
    // 2026-08-03 est un lundi
    expect(badgeJour("2026-08-03T09:00")).toBe("lun. 3");
  });
});

describe("heureDebut", () => {
  it("extrait l'heure quand présente", () => {
    expect(heureDebut("2026-08-04T09:00")).toBe("09:00");
  });

  it("renvoie null pour une date seule", () => {
    expect(heureDebut("2026-08-04")).toBeNull();
  });
});

describe("slugPriorite", () => {
  it("produit un suffixe de classe CSS stable et sans accent", () => {
    expect(slugPriorite("À traiter")).toBe("a-traiter");
    expect(slugPriorite("Vital")).toBe("vital");
    expect(slugPriorite("Détente")).toBe("detente");
    expect(slugPriorite("Optionnelle")).toBe("optionnelle");
  });
});
