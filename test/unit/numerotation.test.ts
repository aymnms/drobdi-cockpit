import { describe, expect, it } from "vitest";
import { prochainNumeroTD } from "../../src/domain/numerotation";

describe("prochainNumeroTD", () => {
  it("démarre à TD-0001 sur un vault vide", () => {
    expect(prochainNumeroTD([])).toBe("TD-0001");
  });

  it("incrémente le maximum existant", () => {
    expect(prochainNumeroTD(["TD-0001", "TD-0002"])).toBe("TD-0003");
    expect(prochainNumeroTD(["TD-0041"])).toBe("TD-0042");
  });

  it("se base sur le max, jamais ne comble un trou (jamais réutilisé)", () => {
    expect(prochainNumeroTD(["TD-0001", "TD-0005"])).toBe("TD-0006");
  });

  it("ignore l'ordre d'entrée", () => {
    expect(prochainNumeroTD(["TD-0009", "TD-0002", "TD-0007"])).toBe("TD-0010");
  });

  it("garde un padding 4 chiffres et déborde proprement au-delà", () => {
    expect(prochainNumeroTD(["TD-0099"])).toBe("TD-0100");
    expect(prochainNumeroTD(["TD-9999"])).toBe("TD-10000");
  });

  it("accepte aussi des numéros bruts sans préfixe", () => {
    expect(prochainNumeroTD(["0003"])).toBe("TD-0004");
  });

  it("ignore les entrées sans chiffres (compte pour 0)", () => {
    expect(prochainNumeroTD(["brouillon", "TD-0002"])).toBe("TD-0003");
    expect(prochainNumeroTD(["sans-numero"])).toBe("TD-0001");
  });
});
