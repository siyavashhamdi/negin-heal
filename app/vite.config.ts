import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { ENAMAD_DEV_PROXY_PATH, ENAMAD_LOGO_PATH } from "./src/shared/enamad.constants";
import {
  PWA_BACKGROUND_COLOR,
  PWA_ICON_192,
  PWA_ICON_512,
  PWA_THEME_COLOR,
} from "./src/constants/pwa.constants";

const appDir = path.dirname(fileURLToPath(import.meta.url));

function parseAllowedHosts(value: string | undefined): string[] | true {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "*") {
    return true;
  }

  return trimmed
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

function buildEnamadReferer(apiBaseUrl: string): string {
  return `${new URL(apiBaseUrl).origin}/`;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.VITE_PORT) || 8080;
  const apiTarget = env.VITE_API_BASE_URL || "http://127.0.0.1:5701";
  const allowedHosts = parseAllowedHosts(env.VITE_ALLOWED_HOSTS);
  const enamadReferer = buildEnamadReferer(apiTarget);
  const graphqlProxy = {
    "/graphql": {
      target: apiTarget,
      changeOrigin: true,
      ws: true,
    },
  };
  const apiProxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
    },
  };
  const enamadProxy = {
    [ENAMAD_DEV_PROXY_PATH]: {
      target: "https://trustseal.enamad.ir",
      changeOrigin: true,
      rewrite: () => ENAMAD_LOGO_PATH,
      headers: {
        Referer: enamadReferer,
      },
    },
  };

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["logo.png", "icons/*.png"],
        manifest: {
          id: "/",
          name: "Negin Heal",
          short_name: "Negin Heal",
          description: "پلتفرم آموزشی Negin Heal — مسیر یادگیری و مراقبت سلامت",
          theme_color: PWA_THEME_COLOR,
          background_color: PWA_BACKGROUND_COLOR,
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          lang: "fa",
          dir: "rtl",
          categories: ["education", "health"],
          icons: [
            {
              src: PWA_ICON_192,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: PWA_ICON_512,
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        },
        devOptions: {
          enabled: false,
          type: "module",
          navigateFallback: "index.html",
        },
      }),
    ],
    server: {
      port,
      strictPort: true,
      allowedHosts,
      ...(env.VITE_EXPOSE_VIA_NETWORK === "true" ? { host: "0.0.0.0" } : {}),
      proxy: {
        ...graphqlProxy,
        ...apiProxy,
        ...enamadProxy,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      strictPort: true,
      open: false,
      allowedHosts,
      proxy: {
        ...graphqlProxy,
        ...apiProxy,
        ...enamadProxy,
      },
    },
    optimizeDeps: {
      include: ["@apollo/client", "@apollo/client/react"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    resolve: {
      dedupe: ["@apollo/client"],
      // stylis-plugin-rtl's "module" entry is ESM-only; alias the CJS build so Vite's
      // resolver does not fail when that file is missing from a broken install.
      alias: {
        "stylis-plugin-rtl": path.resolve(
          appDir,
          "node_modules/stylis-plugin-rtl/dist/cjs/stylis-rtl.js",
        ),
      },
    },
    build: {
      sourcemap: false,
      reportCompressedSize: false,
      cssMinify: "esbuild",
      minify: "esbuild",
      rollupOptions: {
        // Lower parallelism reduces peak memory during production builds.
        maxParallelFileOps: 1,
      },
    },
  };
});
