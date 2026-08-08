import { relative } from "node:path";
import { ItemView, TFile, type WorkspaceLeaf, debounce } from "obsidian";
import type { ActionsCockpit, TacheAffichee } from "../ui/rendu";
import { rendreCockpit } from "../ui/rendu";
import { VaultDrobdi } from "./vaultRuntime";

export const VUE_COCKPIT = "drobdi-cockpit-view";

/**
 * Vue principale du cockpit (onglet Obsidian autonome).
 *
 * v0.5 (J4) : rend le bandeau métriques, le kanban du sprint et le panneau
 * backlog en lecture seule, et se rafraîchit quand un fichier de `taches/` ou
 * `sprints/` change. Les gestes d'écriture (drag & drop, capture, planification)
 * arrivent en J5.
 */
export class CockpitView extends ItemView {
  private readonly vault: VaultDrobdi;
  private readonly rafraichir: () => void;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.vault = new VaultDrobdi(this.app);
    // Recharge groupée : plusieurs modifications rapprochées ⇒ un seul rendu.
    this.rafraichir = debounce(() => void this.rendre(), 200, true);
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
    // J4-6 : rafraîchissement réactif sur les fichiers du système drobdi.
    this.registerEvent(
      this.app.vault.on("modify", (f) => this.siPertinent(f.path)),
    );
    this.registerEvent(
      this.app.vault.on("create", (f) => this.siPertinent(f.path)),
    );
    this.registerEvent(
      this.app.vault.on("delete", (f) => this.siPertinent(f.path)),
    );
    this.registerEvent(
      this.app.vault.on("rename", (f) => this.siPertinent(f.path)),
    );
    await this.rendre();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private siPertinent(cheminVault: string): void {
    if (cheminVault.startsWith("taches/") || cheminVault.startsWith("sprints/")) {
      this.rafraichir();
    }
  }

  private actions(): ActionsCockpit {
    return {
      onOuvrir: (t) => this.ouvrir(t),
    };
  }

  /** Ouvre la note d'une tâche dans un nouvel onglet. */
  private async ouvrir(t: TacheAffichee): Promise<void> {
    const cheminRelatif = relative(this.vault.racine(), t.chemin);
    const fichier = this.app.vault.getAbstractFileByPath(cheminRelatif);
    if (fichier instanceof TFile) {
      await this.app.workspace.getLeaf("tab").openFile(fichier);
    }
  }

  private async rendre(): Promise<void> {
    try {
      const etat = await this.vault.charger(new Date());
      rendreCockpit(this.contentEl, etat, this.actions());
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: `Erreur de chargement : ${message}` });
      console.error("[drobdi-cockpit]", e);
    }
  }
}
