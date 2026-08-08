import { join } from "node:path";
import { type App, FileSystemAdapter } from "obsidian";
import { type CockpitData, construireCockpit } from "../domain/cockpit";
import { type PointBurndown, pointsBurndown, tauxRealisation } from "../domain/metriques";
import { bornesSemaineISO, sprintCourant } from "../domain/semaineISO";
import type { FichierSprint } from "../domain/sprint";
import { type TacheVault, detecterSprintCourant, listerTaches } from "./vaultFs";

/** Emplacements (relatifs à la racine du vault) des dossiers du système drobdi. */
export interface DossiersDrobdi {
  taches: string;
  sprints: string;
}

const DOSSIERS_PAR_DEFAUT: DossiersDrobdi = { taches: "taches", sprints: "sprints" };

/** Données chargées pour un rendu du cockpit. */
export interface EtatCockpit {
  cockpit: CockpitData<TacheVault>;
  /** Taux de réalisation du sprint dans `[0, 1]`. */
  taux: number;
  /** Points de la courbe de burndown (7 jours de la semaine ISO courante). */
  burndown: PointBurndown[];
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

  /** Chemin absolu de la racine du vault (pour convertir un chemin fichier en chemin vault-relatif). */
  racine(): string {
    return this.cheminBase();
  }

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
    const taux = tauxRealisation(cockpit.tachesSprint);
    const burndown = pointsBurndown(cockpit.tachesSprint, bornesSemaineISO(maintenant));
    return { cockpit, taux, burndown, ficheSprint };
  }
}
