
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    sentryVitePlugin({
      org: "victure-pharmacy",
      project: "victure-pharmacy",
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and should be stored in environment variables
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Enable source map uploading for production builds
      sourcemaps: {
        include: ["./dist"],
        ignore: ["node_modules"],
        urlPrefix: "~/",
      },
      
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
  }
}));
