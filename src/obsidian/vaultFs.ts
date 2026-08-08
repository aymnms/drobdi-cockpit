import { readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  lireChampsBruts,
  parseFrontmatter,
  serializeFrontmatter,
} from "../domain/frontmatter";
import { sprintCourant } from "../domain/semaineISO";
import type { FichierSprint } from "../domain/sprint";
import type { Tache } from "../domain/tache";

/**
 * Adaptateur système de fichiers du vault drobdi.
 *
 * Ne dépend PAS de l'API Obsidian : il s'appuie sur `node:fs` et les fonctions
 * pures du domaine (parse/serialize). Cela le rend testable sur un vrai FS
 * temporaire (garde-fou §5 : aucun mock de l'API Obsidian). Les mêmes garanties
 * que `processFrontMatter` sont assurées par le sérialiseur : ordre canonique,
 * wikilinks quotés, corps de note préservé au caractère près.
 *
 * Le plugin ne possède aucune donnée : on ne fait que lire/écrire des fichiers
 * existants du vault, au schéma v2.
 */

const RE_FICHIER_TD = /^TD-\d{4,}\.md$/;

/**
 * Tâche telle que manipulée par le runtime/UI : le frontmatter (`Tache`) enrichi
 * de son identifiant (`TD-XXXX`) et de son chemin fichier. Les deux champs
 * supplémentaires sont ignorés par `serializeFrontmatter`/`validerSchema` (qui ne
 * regardent que les champs canoniques), donc réécrire une `TacheVault` reste sûr.
 */
export type TacheVault = Tache & { id: string; chemin: string };

/** Lit et parse un fichier tâche `.md`. */
export async function lireTache(chemin: string): Promise<Tache> {
  const raw = await readFile(chemin, "utf8");
  return parseFrontmatter(raw);
}

/**
 * Écrit un contenu de façon atomique : on écrit d'abord un fichier temporaire,
 * puis on le renomme sur la cible (`rename` est atomique sur un même système de
 * fichiers). Une interruption ne peut donc jamais laisser la cible à moitié
 * écrite. En cas d'échec, on nettoie le temporaire.
 */
export async function ecrireAtomique(chemin: string, contenu: string): Promise<void> {
  const tmp = `${chemin}.tmp-${process.pid}-${process.hrtime.bigint()}`;
  try {
    await writeFile(tmp, contenu, "utf8");
    await rename(tmp, chemin);
  } catch (e) {
    await unlink(tmp).catch(() => {});
    throw e;
  }
}

/**
 * Réécrit une tâche : sérialise dans l'ordre canonique et écrit atomiquement.
 * Le corps de note porté par la `Tache` est préservé tel quel.
 */
export async function ecrireTache(chemin: string, tache: Tache): Promise<void> {
  await ecrireAtomique(chemin, serializeFrontmatter(tache));
}

/** Liste les tâches d'un dossier : uniquement les fichiers `TD-XXXX.md`. */
export async function listerTaches(dossierTaches: string): Promise<TacheVault[]> {
  const entrees = await readdir(dossierTaches);
  const fichiers = entrees.filter((f) => RE_FICHIER_TD.test(f)).sort();
  const taches: TacheVault[] = [];
  for (const f of fichiers) {
    const chemin = join(dossierTaches, f);
    const tache = await lireTache(chemin);
    taches.push({ ...tache, id: f.replace(/\.md$/, ""), chemin });
  }
  return taches;
}

/**
 * Détecte la fiche du sprint de la semaine ISO de `maintenant`. Cherche le
 * fichier `Sprint-YYYY-Wxx.md` dans `dossierSprints`. Retourne `null` si absent.
 */
export async function detecterSprintCourant(
  dossierSprints: string,
  maintenant: Date,
): Promise<FichierSprint | null> {
  const sprint = sprintCourant(maintenant);
  const chemin = join(dossierSprints, `Sprint-${sprint}.md`);
  let raw: string;
  try {
    raw = await readFile(chemin, "utf8");
  } catch {
    return null;
  }
  const champs = lireChampsBruts(raw);
  return {
    sprint: champs.Sprint ?? sprint,
    semaine: champs.Semaine,
    statut: champs.Statut ?? "",
    chemin,
  };
}
