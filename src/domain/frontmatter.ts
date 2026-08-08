import type { Priorite, Statut, Tache } from "./tache";

/**
 * Parsing / sérialisation du frontmatter canonique du schéma v2.
 *
 * Choix : parser « maison » ligne à ligne plutôt qu'un YAML générique. Le schéma
 * est plat (paires `Clé: valeur`), et un parseur dédié nous rend maîtres de deux
 * garde-fous essentiels : l'ORDRE CANONIQUE exact à l'écriture (§6 du prompt) et
 * la détection des champs hors schéma (R1). Un YAML générique réordonnerait les
 * clés et masquerait les intrus.
 *
 * Philosophie : tolérant en lecture (on collecte les champs inconnus au lieu de
 * planter), strict en écriture (on n'émet QUE les champs canoniques, dans l'ordre).
 */

type TypeChamp = "string" | "wikilink" | "bool";

interface SpecChamp {
  /** Clé YAML exacte (accents, espaces). */
  yaml: string;
  /** Nom interne dans `Tache`. */
  key: keyof Tache;
  type: TypeChamp;
  /** Optionnel = omis du fichier quand absent/vide (R1 : « absents plutôt que vides »). */
  optional: boolean;
}

/** Ordre canonique du schéma v2 — l'ordre de ce tableau EST l'ordre d'écriture. */
const CHAMPS: readonly SpecChamp[] = [
  { yaml: "Titre", key: "titre", type: "string", optional: false },
  { yaml: "Projet", key: "projet", type: "wikilink", optional: false },
  { yaml: "Statut", key: "statut", type: "string", optional: false },
  { yaml: "Priorité", key: "priorite", type: "string", optional: false },
  { yaml: "Sprint", key: "sprint", type: "string", optional: false },
  { yaml: "Début", key: "debut", type: "string", optional: true },
  { yaml: "Fin", key: "fin", type: "string", optional: true },
  { yaml: "Réalisé le", key: "realiseLe", type: "string", optional: true },
  { yaml: "Récurrente", key: "recurrente", type: "wikilink", optional: true },
  { yaml: "Reprend", key: "reprend", type: "wikilink", optional: true },
  { yaml: "Google Calendar", key: "googleCalendar", type: "bool", optional: true },
  { yaml: "Google Event ID", key: "googleEventId", type: "string", optional: true },
];

const RE_FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function deWikilink(valeur: string): string {
  return valeur
    .replace(/^"?\s*\[\[/, "")
    .replace(/\]\]\s*"?$/, "")
    .trim();
}

/**
 * Parse `frontmatter + corps` en `Tache`. Lève si le frontmatter est absent/mal
 * délimité, ou si le corps ne commence pas par `# <Titre>` (R3). Les clés hors
 * schéma sont collectées dans `champsInconnus` (signalées par `validerSchema`, R1).
 */
export function parseFrontmatter(raw: string): Tache {
  const normalise = raw.replace(/\r\n/g, "\n");
  const m = RE_FRONTMATTER.exec(normalise);
  if (!m) {
    throw new Error("Frontmatter YAML absent ou mal délimité (attendu : bloc `---` … `---`).");
  }
  const [, bloc, corps] = m;

  if (!/^\s*#\s+\S/.test(corps)) {
    throw new Error("Le corps de la note doit commencer par « # <Titre> » (R3).");
  }

  const tache: Partial<Tache> & { corps: string } = { corps };
  const inconnus: Record<string, string> = {};

  for (const ligne of bloc.split("\n")) {
    if (ligne.trim() === "") continue;
    const idx = ligne.indexOf(":");
    if (idx === -1) continue;
    const cle = ligne.slice(0, idx).trim();
    const valeur = ligne.slice(idx + 1).trim();

    const spec = CHAMPS.find((c) => c.yaml === cle);
    if (!spec) {
      inconnus[cle] = valeur;
      continue;
    }
    switch (spec.type) {
      case "wikilink":
        if (valeur !== "") (tache as Record<string, unknown>)[spec.key] = deWikilink(valeur);
        break;
      case "bool":
        (tache as Record<string, unknown>)[spec.key] = valeur === "true";
        break;
      default:
        // Champ requis vide (ex. `Sprint:` d'un Backlog) → chaîne vide conservée.
        if (valeur !== "" || !spec.optional) {
          (tache as Record<string, unknown>)[spec.key] = valeur;
        }
    }
  }

  if (tache.titre === undefined) {
    throw new Error("Champ obligatoire `Titre` absent du frontmatter.");
  }
  // Défauts sûrs pour les champs requis manquants : la présence/validité est
  // rapportée par `validerSchema`, pas par une exception ici (lecture tolérante).
  tache.projet ??= "";
  tache.statut ??= "" as Statut;
  tache.priorite ??= "" as Priorite;
  tache.sprint ??= "";

  if (Object.keys(inconnus).length > 0) {
    tache.champsInconnus = inconnus;
  }
  return tache as Tache;
}

/**
 * Sérialise une `Tache` en fichier markdown complet (frontmatter + corps), dans
 * l'ordre canonique exact, en LF, wikilinks quotés. N'émet QUE les champs du
 * schéma (garantit R1 à l'écriture) et omet les optionnels absents/vides ainsi
 * que `Google Calendar` quand il n'est pas `true`.
 */
export function serializeFrontmatter(tache: Tache): string {
  const lignes: string[] = [];

  for (const spec of CHAMPS) {
    const valeur = (tache as Record<string, unknown>)[spec.key];

    // `Sprint` est requis mais légitimement vide pour un Backlog → `Sprint:` sans espace.
    if (spec.key === "sprint") {
      lignes.push(valeur ? `Sprint: ${valeur}` : "Sprint:");
      continue;
    }

    const vide =
      valeur === undefined ||
      valeur === "" ||
      (spec.type === "bool" && valeur === false);
    if (spec.optional && vide) continue;

    switch (spec.type) {
      case "wikilink":
        lignes.push(`${spec.yaml}: "[[${valeur ?? ""}]]"`);
        break;
      case "bool":
        lignes.push(`${spec.yaml}: ${valeur ? "true" : "false"}`);
        break;
      default:
        lignes.push(`${spec.yaml}: ${valeur ?? ""}`);
    }
  }

  return `---\n${lignes.join("\n")}\n---\n${tache.corps ?? ""}`;
}
