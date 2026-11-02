import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * Renders a component inside a minimal memory router so that <Link> works.
 * Every path renders the same component.
 */
export function renderWithRouter(Component: () => ReactNode, path = "/") {
  const rootRoute = createRootRoute({ component: Outlet });
  const index = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Component });
  const rest = createRoute({ getParentRoute: () => rootRoute, path: "$", component: Component });
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, rest]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router as never} />);
}
