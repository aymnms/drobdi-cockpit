import { relative } from "node:path";
import { ItemView, Menu, TFile, type WorkspaceLeaf, debounce } from "obsidian";
import { bornesSemaineISO, sprintCourant } from "../domain/semaineISO";
import type { Tache } from "../domain/tache";
import {
  avancerStatut,
  planifierCreneau,
  trierVersBacklog,
  trierVersSprint,
} from "../domain/transitions";
import type { ActionsCockpit, TacheAffichee } from "../ui/rendu";
import { rendreCockpit } from "../ui/rendu";
import { VaultDrobdi } from "./vaultRuntime";

export const VUE_COCKPIT = "drobdi-cockpit-view";

/**
 * Vue principale du cockpit (onglet Obsidian autonome).
 *
 * v1 (J5) : rend le cockpit et branche les 4 gestes. Chaque geste appelle une
 * transition pure du domaine puis écrit le fichier de façon atomique et minimale
 * via `VaultDrobdi`. La vue se rafraîchit après chaque écriture (et réagit aussi
 * aux modifications externes des fichiers `taches/`/`sprints/`).
 */
export class CockpitView extends ItemView {
  private readonly vault: VaultDrobdi;
  private readonly rafraichir: () => void;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.vault = new VaultDrobdi(this.app);
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
    this.registerEvent(this.app.vault.on("modify", (f) => this.siPertinent(f.path)));
    this.registerEvent(this.app.vault.on("create", (f) => this.siPertinent(f.path)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.siPertinent(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f) => this.siPertinent(f.path)));
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
      onOuvrir: (t) => void this.ouvrir(t),
      onAvancer: (t, cible) => void this.appliquer(t, avancerStatut(t, cible, new Date())),
      onEntrerSprint: (t) =>
        void this.appliquer(t, trierVersSprint(t, sprintCourant(new Date()))),
      onSortirSprint: (t) => void this.appliquer(t, trierVersBacklog(t)),
      onPlanifier: (t, ancre) => this.menuPlanification(t, ancre),
    };
  }

  /** Applique une transition (tâche modifiée) puis réécrit + re-rend. */
  private async appliquer(t: TacheAffichee, modifiee: Tache): Promise<void> {
    try {
      await this.vault.enregistrer(t.chemin, modifiee);
      await this.rendre();
    } catch (e) {
      console.error("[drobdi-cockpit] écriture impossible", e);
    }
  }

  /** Menu de planification (geste J5-4) : les 7 jours de la semaine ISO courante. */
  private menuPlanification(t: TacheAffichee, ancre: HTMLElement): void {
    const menu = new Menu();
    const { debut } = bornesSemaineISO(new Date());
    const fmt = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });

    for (let i = 0; i < 7; i++) {
      const jour = new Date(debut);
      jour.setDate(debut.getDate() + i);
      const iso = `${jour.getFullYear()}-${String(jour.getMonth() + 1).padStart(2, "0")}-${String(jour.getDate()).padStart(2, "0")}`;
      menu.addItem((item) =>
        item
          .setTitle(fmt.format(jour))
          .setChecked(t.debut?.slice(0, 10) === iso)
          .onClick(() => void this.appliquer(t, planifierCreneau(t, iso))),
      );
    }

    if (t.debut) {
      menu.addSeparator();
      menu.addItem((item) =>
        item
          .setTitle("Retirer la planification")
          .setIcon("trash")
          .onClick(() => {
            const sans: Tache = { ...t };
            delete sans.debut;
            delete sans.fin;
            void this.appliquer(t, sans);
          }),
      );
    }

    const rect = ancre.getBoundingClientRect();
    menu.showAtPosition({ x: rect.left, y: rect.bottom });
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
