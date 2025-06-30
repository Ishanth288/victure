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
      // Optimize for production deployment
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            'ui-radix': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-toast', '@radix-ui/react-tabs'],
            'ui-components': ['@/components/ui/button', '@/components/ui/card', '@/components/ui/input', '@/components/ui/table'],
            supabase: ['@supabase/supabase-js'],
            router: ['react-router-dom'],
            'date-utils': ['date-fns'],
            icons: ['lucide-react'],
            'style-utils': ['clsx', 'tailwind-merge'],
            charts: ['recharts'],
            motion: ['framer-motion'],
            seo: ['react-helmet-async'],
            'react-query': ['@tanstack/react-query'],
            forms: ['react-hook-form']
          }
        }
      },
      // Improve build performance and size
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false, // Disable sourcemaps in production for faster loading
      cssCodeSplit: true,
      reportCompressedSize: false, // Faster builds
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'date-fns',
        'react-router-dom',
        'react-helmet-async'
      ],
      // exclude: ['@lovable-dev/lovable'] // Temporarily removed for debugging
    },
    // Reduce console noise
    logLevel: isDevelopment ? 'info' : 'warn',
    define: {
      __DEV__: isDevelopment,
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    envPrefix: ['VITE_']
  };
});
