
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { securityHeaders } from "./src/security/securityHeaders";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
    cors: true
  },
  plugins: [
    react({
      jsxImportSource: "react",
      plugins: [["@swc/plugin-emotion", {}]]
    }),
    mode === 'development' &&
    componentTagger(),
    sentryVitePlugin({
      org: "victure-pharmacy",
      project: "victure-pharmacy",
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and should be stored in environment variables
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Only generate source maps and upload them when in production
      disable: mode !== 'production',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Generate source maps in production
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.message.includes('The "this" keyword is equivalent to "undefined"')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
}));
