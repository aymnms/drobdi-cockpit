import { join } from "node:path";
import { type App, FileSystemAdapter } from "obsidian";
import { type CockpitData, construireCockpit } from "../domain/cockpit";
import { sprintCourant } from "../domain/semaineISO";
import type { FichierSprint } from "../domain/sprint";
import { detecterSprintCourant, listerTaches } from "./vaultFs";

/** Emplacements (relatifs à la racine du vault) des dossiers du système drobdi. */
export interface DossiersDrobdi {
  taches: string;
  sprints: string;
}

const DOSSIERS_PAR_DEFAUT: DossiersDrobdi = { taches: "taches", sprints: "sprints" };

/** Données chargées pour un rendu du cockpit. */
export interface EtatCockpit {
  cockpit: CockpitData;
  /** Fiche sprint courante si elle existe sur le disque, sinon `null`. */
  ficheSprint: FichierSprint | null;
}

/**
 * Passerelle runtime entre Obsidian et l'adaptateur `vaultFs`. Résout le chemin
 * absolu du vault (desktop) puis délègue aux fonctions FS testées. Le plugin ne
 * possède aucune donnée : on ne lit ici que des fichiers existants du vault.
 */
export class VaultDrobdi {
  constructor(
    private readonly app: App,
    private readonly dossiers: DossiersDrobdi = DOSSIERS_PAR_DEFAUT,
  ) {}

  private cheminBase(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    throw new Error(
      "drobdi-cockpit nécessite un vault local (adaptateur non-fichier détecté, ex. mobile).",
    );
  }

  /** Charge et regroupe l'état du cockpit pour l'instant `maintenant`. */
  async charger(maintenant: Date): Promise<EtatCockpit> {
    const base = this.cheminBase();
    const taches = await listerTaches(join(base, this.dossiers.taches));
    const ficheSprint = await detecterSprintCourant(
      join(base, this.dossiers.sprints),
      maintenant,
    );
    const cockpit = construireCockpit(taches, sprintCourant(maintenant));
    return { cockpit, ficheSprint };
  }
}
