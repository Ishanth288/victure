import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

import { securityHeaders } from "./src/security/securityHeaders";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';
  
  // Validate required environment variables for production


  return {
    server: {
      host: "::",
      port: 8080,
      headers: securityHeaders,
      cors: true
    },
    plugins: [
      react({
        jsxImportSource: "react",
      }),
      mode === 'development' && componentTagger(),

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
      include: ['react-animated-counter'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    }
  };
});
