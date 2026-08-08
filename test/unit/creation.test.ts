import { describe, expect, it } from "vitest";
import { creerTache } from "../../src/domain/creation";
import { serializeFrontmatter } from "../../src/domain/frontmatter";
import { validerSchema } from "../../src/domain/validation";

describe("creerTache", () => {
  it("crée une tâche Backlog canonique avec le prochain numéro TD", () => {
    const { id, tache } = creerTache("Nouvelle idée", "Cockpit", ["TD-0007"]);
    expect(id).toBe("TD-0008");
    expect(tache.statut).toBe("Backlog");
    expect(tache.sprint).toBe("");
    expect(tache.titre).toBe("Nouvelle idée");
    expect(tache.projet).toBe("Cockpit");
    expect(tache.priorite).toBe("À traiter"); // défaut neutre
  });

  it("produit un corps commençant par « # <Titre> » (R3)", () => {
    const { tache } = creerTache("Ranger le garage", "Maison", []);
    expect(tache.corps.trimStart().startsWith("# Ranger le garage")).toBe(true);
  });

  it("le résultat est valide et sérialisable sans perte", () => {
    const { tache } = creerTache("Idée", "Cockpit", []);
    expect(validerSchema(tache)).toEqual([]);
    expect(serializeFrontmatter(tache)).toContain("Statut: Backlog");
  });

  it("tolère un projet vide (capture rapide, projet optionnel)", () => {
    const { tache } = creerTache("Sans projet", "", []);
    expect(tache.projet).toBe("");
  });
});
