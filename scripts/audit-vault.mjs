#!/usr/bin/env node
// Audit LECTURE SEULE d'un vault réel : pour chaque fichier taches/TD-XXXX.md,
// simule le cycle lecture→réécriture avec le CODE EXACT du plugin et signale
// tout fichier qui serait modifié au-delà du champ voulu (réordonné, ou avec un
// champ hors-schéma qui serait perdu). N'ÉCRIT RIEN dans le vault.
//
// Usage : node scripts/audit-vault.mjs "/chemin/vers/le/vault" [dossierTaches]
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import esbuild from "esbuild";

const vault = process.argv[2];
const dossierTaches = process.argv[3] ?? "taches";
if (!vault) {
  console.error('Usage : node scripts/audit-vault.mjs "/chemin/vers/le/vault" [dossierTaches]');
  process.exit(1);
}

// Bundle les fonctions du domaine pour auditer avec exactement le même code.
const build = await esbuild.build({
  entryPoints: [join(process.cwd(), "src/domain/frontmatter.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const tmp = await mkdtemp(join(tmpdir(), "drobdi-audit-"));
const modPath = join(tmp, "frontmatter.mjs");
await writeFile(modPath, build.outputFiles[0].text);
const { parseFrontmatter, serializeFrontmatter } = await import(modPath);

const dir = join(vault, dossierTaches);
let fichiers;
try {
  fichiers = (await readdir(dir)).filter((f) => /^TD-\d{4,}\.md$/.test(f)).sort();
} catch (e) {
  console.error(`Impossible de lire ${dir} : ${e.message}`);
  process.exit(1);
}

const problemes = [];
let ok = 0;
for (const f of fichiers) {
  const brut = (await readFile(join(dir, f), "utf8")).replace(/\r\n/g, "\n");
  try {
    const t = parseFrontmatter(brut);
    const rondTrip = serializeFrontmatter(t);
    if (rondTrip === brut) {
      ok++;
    } else if (t.champsInconnus) {
      problemes.push(`✗ ${f} — champ(s) hors schéma qui seraient PERDUS : ${Object.keys(t.champsInconnus).join(", ")}`);
    } else {
      problemes.push(`✗ ${f} — serait réécrit (ordre des champs / normalisation)`);
    }
  } catch (e) {
    problemes.push(`✗ ${f} — non parsable : ${e.message}`);
  }
}

console.log(`\nAudit de ${fichiers.length} fichier(s) dans ${dir}`);
console.log(`  ${ok} identiques au round-trip (écriture sûre)`);
console.log(`  ${problemes.length} à examiner :\n`);
for (const p of problemes) console.log(`  ${p}`);
console.log(
  problemes.length
    ? "\n⚠️  Examine ces fichiers avant d'utiliser les gestes dessus (git diff sera ton filet)."
    : "\n✅ Tous les fichiers round-trip à l'identique : les écritures ne modifieront QUE le champ voulu.",
);
process.exit(problemes.length ? 2 : 0);
