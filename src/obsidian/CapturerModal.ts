import { type App, Modal } from "obsidian";

/**
 * Modale du geste « Capturer une idée » (J5-3) : un champ Titre (obligatoire) et
 * un champ Projet (optionnel). Entrée valide et crée la tâche en Backlog.
 * Objectif : capturer en deux secondes, sans configuration.
 */
export class CapturerModal extends Modal {
  constructor(
    app: App,
    private readonly onValider: (titre: string, projet: string) => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("drobdi-capture");
    contentEl.createEl("h3", { text: "Capturer une idée" });

    const titre = contentEl.createEl("input", {
      type: "text",
      placeholder: "Titre de la tâche",
      cls: "drobdi-capture-titre",
    });
    const projet = contentEl.createEl("input", {
      type: "text",
      placeholder: "Projet (optionnel)",
      cls: "drobdi-capture-projet",
    });
    titre.focus();

    const valider = async () => {
      const t = titre.value.trim();
      if (!t) {
        titre.focus();
        return;
      }
      this.close();
      await this.onValider(t, projet.value.trim());
    };

    const surEntree = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void valider();
      }
    };
    titre.addEventListener("keydown", surEntree);
    projet.addEventListener("keydown", surEntree);

    const actions = contentEl.createDiv("drobdi-capture-actions");
    const bouton = actions.createEl("button", { text: "Créer", cls: "mod-cta" });
    bouton.addEventListener("click", () => void valider());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
