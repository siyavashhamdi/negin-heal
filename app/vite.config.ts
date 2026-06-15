import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.VITE_PORT) || 8080;

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      ...(env.VITE_EXPOSE_VIA_NETWORK === "true" ? { host: "0.0.0.0" } : {}),
      proxy: {
        "/graphql": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      strictPort: true,
      open: false,
      allowedHosts: ["asnaf.duckdns.org"],
    },
    optimizeDeps: {
      include: ["@apollo/client", "@apollo/client/react"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    resolve: {
      dedupe: ["@apollo/client"],
    },
  };
});
