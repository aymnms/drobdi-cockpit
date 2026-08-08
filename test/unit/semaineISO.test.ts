import { describe, expect, it } from "vitest";
import { bornesSemaineISO, semaineISO, sprintCourant } from "../../src/domain/semaineISO";

describe("semaineISO (ISO 8601)", () => {
  it("formate en YYYY-Wxx avec padding sur 2 chiffres", () => {
    // 2026-01-01 est un jeudi → première semaine de 2026
    expect(semaineISO(new Date(2026, 0, 1))).toBe("2026-W01");
  });

  it("place le 1er janvier vendredi dans la dernière semaine de l'année précédente", () => {
    // 2021-01-01 est un vendredi → appartient à 2020-W53
    expect(semaineISO(new Date(2021, 0, 1))).toBe("2020-W53");
  });

  it("gère les années à 53 semaines (2020 se termine en W53)", () => {
    // 2020-12-31 est un jeudi → 2020-W53
    expect(semaineISO(new Date(2020, 11, 31))).toBe("2020-W53");
    // 2015 a 53 semaines : 2016-01-01 (vendredi) → 2015-W53
    expect(semaineISO(new Date(2016, 0, 1))).toBe("2015-W53");
  });

  it("place fin décembre lundi dans la W01 de l'année suivante", () => {
    // 2019-12-30 est un lundi → 2020-W01
    expect(semaineISO(new Date(2019, 11, 30))).toBe("2020-W01");
    // 2019-12-29 est un dimanche → toujours 2019-W52
    expect(semaineISO(new Date(2019, 11, 29))).toBe("2019-W52");
  });

  it("calcule une semaine de milieu d'année", () => {
    // 2026-08-08 (samedi) → 2026-W32 (sprint courant de référence du projet)
    expect(semaineISO(new Date(2026, 7, 8))).toBe("2026-W32");
  });

  it("est indépendante de l'heure dans la journée", () => {
    expect(semaineISO(new Date(2026, 7, 8, 23, 59))).toBe("2026-W32");
    expect(semaineISO(new Date(2026, 7, 8, 0, 0))).toBe("2026-W32");
  });
});

describe("sprintCourant", () => {
  it("retourne la semaine ISO du moment donné (wrapper métier)", () => {
    expect(sprintCourant(new Date(2026, 7, 8))).toBe("2026-W32");
  });
});

describe("bornesSemaineISO", () => {
  it("retourne le lundi et le dimanche de la semaine (2026-W32)", () => {
    const { debut, fin } = bornesSemaineISO(new Date(2026, 7, 8)); // samedi
    expect([debut.getFullYear(), debut.getMonth(), debut.getDate()]).toEqual([2026, 7, 3]); // lundi 3 août
    expect([fin.getFullYear(), fin.getMonth(), fin.getDate()]).toEqual([2026, 7, 9]); // dimanche 9 août
    expect(debut.getDay()).toBe(1); // lundi
    expect(fin.getDay()).toBe(0); // dimanche
  });

  it("gère un dimanche (reste dans la même semaine ISO)", () => {
    const { debut } = bornesSemaineISO(new Date(2026, 7, 9)); // dimanche 9 août
    expect(debut.getDate()).toBe(3); // même lundi 3 août
  });
});
