import { browser, expect } from "@wdio/globals";
import { sprintCourant } from "../../src/domain/semaineISO";

/**
 * Smoke tests E2E (J7) pilotant une vraie instance Obsidian via
 * wdio-obsidian-service. Volontairement peu nombreux : lents et coûteux à
 * maintenir (cf. PLAN.md). Ils valident le bout-en-bout des gestes clés.
 *
 * Note : le glisser-déposer HTML5 n'est pas déclenchable par un vrai pointeur
 * sous WebDriver ; on dispatche donc les événements drag dans la page pour
 * exercer la chaîne runtime réelle (handlers → transition → écriture fichier →
 * rafraîchissement), ce qui reste un test de bout en bout dans Obsidian.
 */

const SPRINT = sprintCourant(new Date());

// `executeObsidian` sérialise la fonction et l'exécute dans Obsidian : les
// variables de closure ne sont PAS capturées, il faut passer les valeurs en
// arguments (comme `browser.execute`).
// biome-ignore lint/suspicious/noExplicitAny: contexte injecté par le service
type Obs = { executeObsidian(fn: (ctx: { app: any }, ...a: any[]) => any, ...a: any[]): Promise<any> };

async function lireFichier(chemin: string): Promise<string> {
  return (browser as unknown as Obs).executeObsidian(
    ({ app }, p: string) => app.vault.adapter.read(p),
    chemin,
  );
}

async function cheminsTaches(): Promise<string[]> {
  return (browser as unknown as Obs).executeObsidian(({ app }) =>
    app.vault
      .getFiles()
      .map((f: { path: string }) => f.path)
      .filter((p: string) => p.startsWith("taches/")),
  );
}

describe("Cockpit drobdi — smoke E2E", function () {
  before(async function () {
    await browser.reloadObsidian({ vault: "./e2e/vault" });
  });

  it("J7-2 : ouvre le cockpit et affiche le sprint courant", async function () {
    await browser.executeObsidianCommand("drobdi-cockpit:ouvrir-cockpit");
    await expect(browser.$(".drobdi-kanban")).toExist();
    await expect(browser.$(".drobdi-sprint-id")).toHaveText(new RegExp(`Sprint\\s+${SPRINT}`));
  });

  it("J7-3 : le geste « avancer » modifie le fichier de la tâche", async function () {
    await browser.executeObsidianCommand("drobdi-cockpit:ouvrir-cockpit");
    await browser.$('.drobdi-carte[data-td="TD-9001"]').waitForExist();

    // Déclenche le drag→drop de TD-9001 (À faire → En cours) dans la page.
    await browser.execute(() => {
      const carte = document.querySelector('.drobdi-carte[data-td="TD-9001"]');
      const colonne = document.querySelector('.drobdi-colonne[data-statut="En cours"]');
      carte?.dispatchEvent(new Event("dragstart", { bubbles: true }));
      colonne?.dispatchEvent(new Event("drop", { bubbles: true }));
      carte?.dispatchEvent(new Event("dragend", { bubbles: true }));
    });

    await browser.waitUntil(
      async () => (await lireFichier("taches/TD-9001.md")).includes("Statut: En cours"),
      { timeout: 15000, timeoutMsg: "Le fichier n'est pas passé à « En cours »." },
    );
    const contenu = await lireFichier("taches/TD-9001.md");
    expect(contenu).toContain("Corps à préserver."); // corps intact
  });

  it("J7-4 : le geste « capturer » crée un nouveau TD-XXXX.md valide", async function () {
    const avant = await cheminsTaches();

    await browser.executeObsidianCommand("drobdi-cockpit:capturer-idee");
    const champ = browser.$(".drobdi-capture-titre");
    await champ.waitForExist();
    await champ.setValue("Idée capturée en E2E");
    await browser.keys("Enter");

    await browser.waitUntil(async () => (await cheminsTaches()).length === avant.length + 1, {
      timeout: 15000,
      timeoutMsg: "Aucun nouveau fichier tâche créé.",
    });

    const apres = await cheminsTaches();
    const nouveau = apres.find((p) => !avant.includes(p));
    expect(nouveau).toBeDefined();
    const contenu = await lireFichier(nouveau as string);
    expect(contenu).toContain("Idée capturée en E2E");
    expect(contenu).toContain("Statut: Backlog");
  });
});
