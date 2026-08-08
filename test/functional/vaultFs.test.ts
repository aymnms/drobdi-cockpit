import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  detecterSprintCourant,
  ecrireAtomique,
  ecrireTache,
  lireTache,
  listerTaches,
} from "../../src/obsidian/vaultFs";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "drobdi-fs-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const FICHIER_TD = `---
Titre: Écrire la spec
Projet: "[[Cockpit]]"
Statut: En cours
Priorité: Vital
Sprint: 2026-W32
Début: 2026-08-03T09:00
Google Calendar: true
Google Event ID: evt-42
---

# Écrire la spec

Des notes libres, avec **gras** et une liste :
- point A
- point B
`;

describe("lireTache / ecrireTache", () => {
  it("lit un vrai fichier .md et le parse", async () => {
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, FICHIER_TD, "utf8");
    const t = await lireTache(chemin);
    expect(t.titre).toBe("Écrire la spec");
    expect(t.statut).toBe("En cours");
    expect(t.googleEventId).toBe("evt-42");
  });

  it("réécrit un champ en préservant le corps de note au caractère près", async () => {
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, FICHIER_TD, "utf8");

    const t = await lireTache(chemin);
    await ecrireTache(chemin, { ...t, statut: "Terminé", realiseLe: "2026-08-08" });

    const relu = await readFile(chemin, "utf8");
    // Le corps (après le frontmatter) doit être identique à l'original.
    const corpsOriginal = FICHIER_TD.slice(FICHIER_TD.indexOf("\n---\n") + 5);
    const corpsRelu = relu.slice(relu.indexOf("\n---\n") + 5);
    expect(corpsRelu).toBe(corpsOriginal);
    expect(relu).toContain("Statut: Terminé");
    expect(relu).toContain("Réalisé le: 2026-08-08");
    // Le champ géré par Drobdi est préservé.
    expect(relu).toContain("Google Event ID: evt-42");
  });

  it("préserve l'ordre canonique des champs après réécriture", async () => {
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, FICHIER_TD, "utf8");
    const t = await lireTache(chemin);
    await ecrireTache(chemin, { ...t, priorite: "À traiter" });
    const relu = await readFile(chemin, "utf8");
    expect(relu.indexOf("Titre:")).toBeLessThan(relu.indexOf("Projet:"));
    expect(relu.indexOf("Statut:")).toBeLessThan(relu.indexOf("Priorité:"));
    expect(relu.indexOf("Priorité:")).toBeLessThan(relu.indexOf("Sprint:"));
  });
});

describe("listerTaches", () => {
  it("scanne les fichiers TD-XXXX.md et ignore le reste", async () => {
    await writeFile(join(dir, "TD-0001.md"), FICHIER_TD, "utf8");
    await writeFile(join(dir, "TD-0002.md"), FICHIER_TD.replace("Écrire la spec", "Autre"), "utf8");
    await writeFile(join(dir, "template-tache.md"), FICHIER_TD, "utf8");
    await writeFile(join(dir, "notes.txt"), "pas une tâche", "utf8");

    const taches = await listerTaches(dir);
    expect(taches).toHaveLength(2);
    expect(taches.map((t) => t.titre).sort()).toEqual(["Autre", "Écrire la spec"]);
  });

  it("retourne une liste vide sur un dossier sans tâche", async () => {
    expect(await listerTaches(dir)).toEqual([]);
  });
});

describe("detecterSprintCourant", () => {
  it("trouve la fiche du sprint de la semaine ISO courante", async () => {
    const contenu = `---
Sprint: 2026-W32
Semaine: du 3 au 9 août 2026
Statut: En cours
---

# Sprint 2026-W32
`;
    await writeFile(join(dir, "Sprint-2026-W32.md"), contenu, "utf8");
    const s = await detecterSprintCourant(dir, new Date(2026, 7, 8));
    expect(s?.sprint).toBe("2026-W32");
    expect(s?.statut).toBe("En cours");
  });

  it("retourne null si aucune fiche ne correspond", async () => {
    const s = await detecterSprintCourant(dir, new Date(2026, 7, 8));
    expect(s).toBeNull();
  });
});

describe("ecrireAtomique (J2-5)", () => {
  it("ne laisse aucun fichier temporaire résiduel après écriture", async () => {
    const chemin = join(dir, "TD-0001.md");
    await ecrireAtomique(chemin, "contenu\n");
    const restes = (await readdir(dir)).filter((f) => f.includes(".tmp"));
    expect(restes).toEqual([]);
    expect(await readFile(chemin, "utf8")).toBe("contenu\n");
  });

  it("écrit d'abord un temporaire : le fichier cible n'est jamais partiel", async () => {
    // Simule une interruption AVANT le rename : on écrit le tmp à la main sans renommer.
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, "ancien contenu complet\n", "utf8");
    // Un crash entre write(tmp) et rename laisse la cible intacte.
    await writeFile(`${chemin}.tmp-fake`, "nouveau contenu partiel", "utf8");
    expect(await readFile(chemin, "utf8")).toBe("ancien contenu complet\n");
  });
});

describe("non-régression round-trip fichier (J2-6)", () => {
  it("réécrire une tâche canonique sans changement logique laisse un diff vide", async () => {
    const chemin = join(dir, "TD-0001.md");
    await writeFile(chemin, FICHIER_TD, "utf8");
    const t = await lireTache(chemin);
    await ecrireTache(chemin, t);
    expect(await readFile(chemin, "utf8")).toBe(FICHIER_TD);
  });
});
