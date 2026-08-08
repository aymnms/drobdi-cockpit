import { Plugin, type WorkspaceLeaf } from "obsidian";
import { CockpitView, VUE_COCKPIT } from "./obsidian/CockpitView";

export default class DrobdiCockpitPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VUE_COCKPIT, (leaf) => new CockpitView(leaf));

    this.addRibbonIcon("layout-dashboard", "Ouvrir le cockpit drobdi", () => {
      void this.activerVue();
    });

    this.addCommand({
      id: "ouvrir-cockpit",
      name: "Ouvrir le cockpit",
      callback: () => {
        void this.activerVue();
      },
    });
  }

  onunload(): void {
    // La vue est détachée automatiquement par Obsidian ; rien à persister.
  }

  /** Ouvre (ou révèle) l'onglet du cockpit dans l'espace de travail principal. */
  private async activerVue(): Promise<void> {
    const { workspace } = this.app;

    const existante = workspace.getLeavesOfType(VUE_COCKPIT);
    let leaf: WorkspaceLeaf | null;
    if (existante.length > 0) {
      leaf = existante[0];
    } else {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VUE_COCKPIT, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
