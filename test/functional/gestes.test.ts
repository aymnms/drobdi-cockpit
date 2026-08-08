import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { creerTache } from "../../src/domain/creation";
import { validerSchema } from "../../src/domain/validation";
import {
  avancerStatut,
  trierVersBacklog,
  trierVersSprint,
} from "../../src/domain/transitions";
import { ecrireTache, lireTache, listerTaches } from "../../src/obsidian/vaultFs";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "drobdi-gestes-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const TD = `---
Titre: Rédiger la spec
Projet: "[[Cockpit]]"
Statut: À faire
Priorité: Vital
Sprint: 2026-W32
---

# Rédiger la spec

Notes libres à préserver.
`;

describe("geste Avancer (J5-1) au niveau fichier", () => {
  it("passe à Terminé, écrit Réalisé le, et préserve le corps", async () => {
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, TD, "utf8");

    const t = await lireTache(chemin);
    await ecrireTache(chemin, avancerStatut(t, "Terminé", new Date(2026, 7, 8)));

    const relu = await readFile(chemin, "utf8");
    expect(relu).toContain("Statut: Terminé");
    expect(relu).toContain("Réalisé le: 2026-08-08");
    expect(relu).toContain("Notes libres à préserver.");
  });
});

describe("geste Trier backlog ↔ sprint (J5-2) au niveau fichier", () => {
  it("entrée en sprint : pose Sprint + Statut À faire atomiquement", async () => {
    const chemin = join(dir, "TD-0002.md");
    await writeFile(chemin, TD.replace("Statut: À faire", "Statut: Backlog").replace("Sprint: 2026-W32", "Sprint:"), "utf8");

    const t = await lireTache(chemin);
    await ecrireTache(chemin, trierVersSprint(t, "2026-W32"));

    const relu = await lireTache(chemin);
    expect(relu.statut).toBe("À faire");
    expect(relu.sprint).toBe("2026-W32");
  });

  it("sortie vers backlog : vide Sprint + Statut Backlog atomiquement", async () => {
    const chemin = join(dir, "TD-0003.md");
    await writeFile(chemin, TD, "utf8");

    const t = await lireTache(chemin);
    await ecrireTache(chemin, trierVersBacklog(t));

    const relu = await lireTache(chemin);
    expect(relu.statut).toBe("Backlog");
    expect(relu.sprint).toBe("");
  });
});

describe("geste Capturer (J5-3) au niveau fichier", () => {
  it("crée un TD-XXXX valide en Backlog, visible par listerTaches", async () => {
    await writeFile(join(dir, "TD-0001.md"), TD, "utf8");

    const existants = (await listerTaches(dir)).map((t) => t.id);
    const { id, tache } = creerTache("Nouvelle idée", "Cockpit", existants);
    expect(id).toBe("TD-0002");

    await ecrireTache(join(dir, `${id}.md`), tache);

    const apres = await listerTaches(dir);
    expect(apres.map((t) => t.id).sort()).toEqual(["TD-0001", "TD-0002"]);
    const creee = apres.find((t) => t.id === "TD-0002");
    expect(creee?.statut).toBe("Backlog");
    expect(validerSchema(creee as (typeof apres)[number])).toEqual([]);
  });
});
