import { Plugin } from "obsidian";

export default class DrobdiCockpitPlugin extends Plugin {
  async onload(): Promise<void> {
    // Le cockpit sera branche ici au fil des jalons (v0 -> v1.1, voir PROMPT-drobdi-cockpit.md).
  }

  onunload(): void {
    // Rien a nettoyer pour l'instant.
  }
}
