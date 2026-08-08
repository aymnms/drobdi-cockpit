import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";
import { CapturerModal } from "./obsidian/CapturerModal";
import { CockpitView, VUE_COCKPIT } from "./obsidian/CockpitView";
import { VaultDrobdi } from "./obsidian/vaultRuntime";

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

    this.addCommand({
      id: "capturer-idee",
      name: "Capturer une idée",
      callback: () => this.capturer(),
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

  /** Ouvre la modale de capture et crée la tâche en Backlog (geste J5-3). */
  private capturer(): void {
    new CapturerModal(this.app, async (titre, projet) => {
      try {
        const id = await new VaultDrobdi(this.app).capturer(titre, projet);
        new Notice(`Tâche ${id} capturée dans le backlog.`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        new Notice(`Échec de la capture : ${message}`);
        console.error("[drobdi-cockpit]", e);
      }
    }).open();
  }
}
