import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Normalises the deployment base path, e.g. "my-repo" -> "/my-repo/".
 * Set BASE_PATH when the app is not served from the domain root
 * (for example on GitHub Pages project sites).
 */
function normalizeBasePath(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "" || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: normalizeBasePath(env["BASE_PATH"]),
    // Resolves the "@/..." import alias from tsconfig.json.
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      tanstackStart({
        // Every page is rendered to static HTML at build time (dist/client),
        // so the app can be hosted on any static web host without a server.
        prerender: {
          enabled: true,
          crawlLinks: true,
          failOnError: true,
        },
        // Additionally emit a client-only shell as 404.html. Static hosts such as
        // GitHub Pages serve it for unknown URLs; the client router then renders
        // the correct page or the "Seite nicht gefunden" screen.
        spa: {
          enabled: true,
          // Render the shell for an unknown URL (handled by the catch-all route
          // src/routes/$.tsx). With the default "/" the shell would replace the
          // prerendered start page, and "Start" would be marked active on 404 pages.
          maskPath: "/404",
          prerender: {
            outputPath: "/404.html",
            crawlLinks: false,
          },
        },
      }),
      viteReact(),
    ],
  };
});
