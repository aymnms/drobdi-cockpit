import { ItemView, type WorkspaceLeaf } from "obsidian";
import { VaultDrobdi } from "./vaultRuntime";

export const VUE_COCKPIT = "drobdi-cockpit-view";

/**
 * Vue principale du cockpit (onglet Obsidian autonome). En v0 (J3), elle affiche
 * un simple en-tête et journalise en console le sprint courant détecté ainsi que
 * les tâches engagées (via `console.table`). Le rendu kanban/bandeau arrive en J4.
 */
export class CockpitView extends ItemView {
  private readonly vault: VaultDrobdi;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.vault = new VaultDrobdi(this.app);
  }

  getViewType(): string {
    return VUE_COCKPIT;
  }

  getDisplayText(): string {
    return "Cockpit";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async onOpen(): Promise<void> {
    const racine = this.contentEl;
    racine.empty();
    racine.addClass("drobdi-cockpit");
    racine.createEl("h2", { text: "Cockpit" });
    const info = racine.createEl("p", { text: "Chargement du sprint courant…" });

    try {
      const { cockpit, ficheSprint } = await this.vault.charger(new Date());
      info.setText(
        `Sprint ${cockpit.sprintId}` +
          (ficheSprint ? ` (${ficheSprint.statut})` : " — aucune fiche sprint") +
          ` · ${cockpit.tachesSprint.length} tâche(s) engagée(s) · ${cockpit.backlog.length} en backlog`,
      );

      // v0 : diagnostic console (J3-3).
      console.info(`[drobdi-cockpit] Sprint courant : ${cockpit.sprintId}`);
      console.table(
        cockpit.tachesSprint.map((t) => ({
          Titre: t.titre,
          Statut: t.statut,
          Priorité: t.priorite,
          Projet: t.projet,
          Début: t.debut ?? "",
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      info.setText(`Erreur de chargement : ${message}`);
      console.error("[drobdi-cockpit]", e);
    }
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }
}
