import { describe, expect, it } from "vitest";
import type { Tache } from "../../src/domain/tache";
import {
  parseFrontmatter,
  serializeFrontmatter,
} from "../../src/domain/frontmatter";

const FICHIER_MINIMAL = `---
Titre: Idée en vrac
Projet: "[[Cockpit]]"
Statut: Backlog
Priorité: À traiter
Sprint:
---

# Idée en vrac
`;

const FICHIER_COMPLET = `---
Titre: Écrire la spec
Projet: "[[Cockpit]]"
Statut: En cours
Priorité: Vital
Sprint: 2026-W32
Début: 2026-08-03T09:00
Fin: 2026-08-03T09:30
Réalisé le: 2026-08-03
Récurrente: "[[REC-01]]"
Reprend: "[[TD-0042]]"
Google Calendar: true
Google Event ID: abc123
---

# Écrire la spec

Des notes libres.
`;

describe("parseFrontmatter", () => {
  it("parse un fichier minimal (Backlog, Sprint vide)", () => {
    const t = parseFrontmatter(FICHIER_MINIMAL);
    expect(t.titre).toBe("Idée en vrac");
    expect(t.projet).toBe("Cockpit");
    expect(t.statut).toBe("Backlog");
    expect(t.priorite).toBe("À traiter");
    expect(t.sprint).toBe("");
    expect(t.debut).toBeUndefined();
    expect(t.googleCalendar).toBeUndefined();
    expect(t.corps).toBe("\n# Idée en vrac\n");
  });

  it("parse tous les champs optionnels (wikilinks déquotés, booléen)", () => {
    const t = parseFrontmatter(FICHIER_COMPLET);
    expect(t.projet).toBe("Cockpit");
    expect(t.debut).toBe("2026-08-03T09:00");
    expect(t.fin).toBe("2026-08-03T09:30");
    expect(t.realiseLe).toBe("2026-08-03");
    expect(t.recurrente).toBe("REC-01");
    expect(t.reprend).toBe("TD-0042");
    expect(t.googleCalendar).toBe(true);
    expect(t.googleEventId).toBe("abc123");
  });

  it("lève une erreur si le frontmatter est absent", () => {
    expect(() => parseFrontmatter("# Pas de frontmatter\n")).toThrow();
  });

  it("lève une erreur si le corps ne commence pas par « # » (R3)", () => {
    const sansTitre = `---
Titre: X
Projet: "[[P]]"
Statut: Backlog
Priorité: À traiter
Sprint:
---

texte sans titre
`;
    expect(() => parseFrontmatter(sansTitre)).toThrow();
  });

  it("collecte les champs hors schéma dans champsInconnus (pour R1)", () => {
    const avecIntrus = `---
Titre: X
Projet: "[[P]]"
Statut: Backlog
Priorité: À traiter
Sprint:
Estimation: 3
---

# X
`;
    const t = parseFrontmatter(avecIntrus);
    expect(t.champsInconnus).toEqual({ Estimation: "3" });
  });

  it("tolère les fins de ligne CRLF en lecture", () => {
    const t = parseFrontmatter(FICHIER_MINIMAL.replace(/\n/g, "\r\n"));
    expect(t.titre).toBe("Idée en vrac");
  });

  it("ignore les lignes de frontmatter sans deux-points", () => {
    const avecLigneOrpheline = `---
Titre: X
Projet: "[[P]]"
ligne sans deux points
Statut: Backlog
Priorité: À traiter
Sprint:
---

# X
`;
    const t = parseFrontmatter(avecLigneOrpheline);
    expect(t.titre).toBe("X");
  });

  it("lève une erreur si le champ Titre est absent", () => {
    const sansTitre = `---
Projet: "[[P]]"
Statut: Backlog
Priorité: À traiter
Sprint:
---

# X
`;
    expect(() => parseFrontmatter(sansTitre)).toThrow(/Titre/);
  });
});

describe("serializeFrontmatter", () => {
  it("sérialise dans l'ordre canonique, LF, wikilinks quotés", () => {
    const t = parseFrontmatter(FICHIER_COMPLET);
    expect(serializeFrontmatter(t)).toBe(FICHIER_COMPLET);
  });

  it("omet les champs optionnels absents et Google Calendar si non true (R1)", () => {
    const t = parseFrontmatter(FICHIER_MINIMAL);
    const out = serializeFrontmatter(t);
    expect(out).toBe(FICHIER_MINIMAL);
    expect(out).not.toContain("Début");
    expect(out).not.toContain("Google Calendar");
  });

  it("n'émet jamais de CRLF", () => {
    const t = parseFrontmatter(FICHIER_COMPLET);
    expect(serializeFrontmatter(t)).not.toContain("\r");
  });
});

describe("round-trip parse ∘ serialize", () => {
  it("préserve un fichier minimal", () => {
    const t = parseFrontmatter(FICHIER_MINIMAL);
    expect(parseFrontmatter(serializeFrontmatter(t))).toEqual(t);
  });

  it("préserve un fichier complet (tous champs + corps)", () => {
    const t: Tache = parseFrontmatter(FICHIER_COMPLET);
    expect(parseFrontmatter(serializeFrontmatter(t))).toEqual(t);
  });
});
