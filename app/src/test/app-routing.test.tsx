import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { primaryNavigation } from "@/config/navigation";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering.
describe("App routing", () => {
  const router = createRouter({ routeTree });

  it.each([
    ["/", "/"],
    ["/lernen", "/lernen/"],
    ["/lernen/grundlagen", "/lernen/$lessonId"],
    ["/lernen/staat", "/lernen/$lessonId"],
    ["/rechner", "/rechner"],
    ["/mehr", "/mehr"],
    ["/depot", "/depot/"],
    ["/depot/kaufen", "/depot/kaufen"],
    ["/depot/verkaufen", "/depot/verkaufen"],
    ["/depot/wertpapier", "/depot/wertpapier"],
    ["/depot/transaktionen", "/depot/transaktionen"],
  ])("matches %s", (path, routeId) => {
    const matches = router.matchRoutes(path);
    expect(matches.at(-1)?.routeId).toBe(routeId);
  });

  it("sends removed or unknown paths to the catch-all not-found route", () => {
    for (const path of ["/zinseszins", "/taschengeld", "/altersvorsorgedepot", "/gibt/es/nicht"]) {
      expect(router.matchRoutes(path).at(-1)?.routeId).toBe("/$");
    }
  });

  it("never falls back to the bare root route", () => {
    expect(router.matchRoutes("/rechner").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("has four main tabs and keeps the calculator under Mehr", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Start",
      "Lernen",
      "Depot",
      "Mehr",
    ]);
    const more = primaryNavigation.find((item) => item.label === "Mehr");
    expect(more?.alsoActiveFor).toContain("/rechner");
  });
});
