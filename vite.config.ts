import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

import { securityHeaders } from "./src/security/securityHeaders";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    server: {
      host: "::",
      port: 8080,
      headers: securityHeaders,
      cors: true,
      hmr: {
        overlay: false // Reduce console noise in development
      }
    },
    plugins: [
      react(),
      isDevelopment && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Optimize chunk sizes
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            supabase: ['@supabase/supabase-js'],
            utils: ['date-fns', 'lucide-react']
          }
        }
      },
      // Improve build performance
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isDevelopment,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'date-fns'
      ],
      exclude: ['@lovable-dev/lovable']
    },
    // Reduce console noise
    logLevel: isDevelopment ? 'info' : 'warn',
    define: {
      __DEV__: isDevelopment,
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
