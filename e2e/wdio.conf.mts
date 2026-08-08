import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { sprintCourant } from "../src/domain/semaineISO";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..");
const VAULT = path.resolve(ICI, "vault");

/**
 * Prépare le vault E2E : génère la fiche sprint et les tâches pour la SEMAINE ISO
 * COURANTE afin que les tests soient indépendants de la date d'exécution. Les
 * fichiers sont écrits avant le lancement d'Obsidian (hook onPrepare).
 */
function preparerVault(): void {
  const sprint = sprintCourant(new Date());
  mkdirSync(path.join(VAULT, "taches"), { recursive: true });
  mkdirSync(path.join(VAULT, "sprints"), { recursive: true });
  mkdirSync(path.join(VAULT, "projets"), { recursive: true });

  writeFileSync(
    path.join(VAULT, "sprints", `Sprint-${sprint}.md`),
    `---\nSprint: ${sprint}\nStatut: En cours\n---\n\n# Sprint ${sprint}\n`,
  );
  writeFileSync(
    path.join(VAULT, "projets", "Cockpit.md"),
    `---\nTitre: Cockpit\nStatut: En cours\nPriorité: Vital\nDomaine: Outillage\n---\n\n# Cockpit\n`,
  );
  // TD-9001 : engagée sur le sprint courant (geste « avancer »).
  writeFileSync(
    path.join(VAULT, "taches", "TD-9001.md"),
    `---\nTitre: Tâche E2E à avancer\nProjet: "[[Cockpit]]"\nStatut: À faire\nPriorité: Vital\nSprint: ${sprint}\n---\n\n# Tâche E2E à avancer\n\nCorps à préserver.\n`,
  );
}

export const config: WebdriverIO.Config = {
  runner: "local",
  framework: "mocha",
  specs: ["./specs/**/*.e2e.ts"],
  maxInstances: 1,

  capabilities: [
    {
      browserName: "obsidian",
      browserVersion: "latest",
      "wdio:obsidianOptions": {
        installerVersion: "earliest",
        plugins: [RACINE],
        vault: VAULT,
      },
    },
  ],

  services: ["obsidian"],
  reporters: ["obsidian"],
  cacheDir: path.resolve(RACINE, ".obsidian-cache"),

  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
  logLevel: "warn",

  onPrepare() {
    preparerVault();
  },
};
