import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.VITE_PORT) || 8080;
  const apiTarget = env.VITE_API_BASE_URL || "http://127.0.0.1:5701";
  const allowedHosts = parseAllowedHosts(env.VITE_ALLOWED_HOSTS);
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

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      allowedHosts,
      ...(env.VITE_EXPOSE_VIA_NETWORK === "true" ? { host: "0.0.0.0" } : {}),
      proxy: {
        ...graphqlProxy,
        ...apiProxy,
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
