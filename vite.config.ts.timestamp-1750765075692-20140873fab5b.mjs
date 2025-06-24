// vite.config.ts
import { defineConfig } from "file:///C:/Users/ishan/victure/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ishan/victure/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/ishan/victure/node_modules/lovable-tagger/dist/index.js";

// src/security/securityHeaders.ts
var securityHeaders = {
  // Prevent XSS attacks by controlling which resources can be loaded
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://*.ingest.sentry.io https://cdn.gpteng.co https://www.googletagmanager.com https://cdn.gpteng.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://aysdilfgxlyuplikmmdt.supabase.co https://*.sentry.io https://*.sentry-cdn.com https://*.ingest.sentry.io https://trends.google.com https://newsapi.org https://api.whatsapp.com https://*.googleapis.com https://www.googletagmanager.com https://cdn.gpteng.co;
    img-src 'self' data: https: blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.google.com https://www.youtube.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s+/g, " ").trim(),
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Control iframe embedding - use CSP frame-ancestors instead for better control
  "X-Frame-Options": "SAMEORIGIN",
  // Add an additional layer of XSS protection for older browsers
  "X-XSS-Protection": "1; mode=block",
  // Control information exposed in referrer header
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Enable HTTP Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // Specify permitted capabilities for your application
  "Permissions-Policy": "camera=self, microphone=self, geolocation=self, interest-cohort=()",
  // Allow requests from all origins for development and preview environments
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  "Access-Control-Allow-Headers": "X-Requested-With,content-type,Authorization,X-Client-Info",
  "Access-Control-Allow-Credentials": "true",
  // Cache control for improved performance and reduced flickering
  "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  // Feature-Policy header for additional security
  "Feature-Policy": "camera self; microphone self; geolocation self;"
};

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\ishan\\victure";
var vite_config_default = defineConfig(({ command, mode }) => {
  const isProduction = mode === "production";
  const isDevelopment = mode === "development";
  return {
    server: {
      host: "::",
      port: 8080,
      headers: securityHeaders,
      cors: true,
      hmr: {
        overlay: false
        // Reduce console noise in development
      }
    },
    plugins: [
      react(),
      isDevelopment && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      // Optimize for production deployment
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
            supabase: ["@supabase/supabase-js"],
            router: ["react-router-dom"],
            utils: ["date-fns", "lucide-react", "clsx", "tailwind-merge"],
            charts: ["recharts"],
            motion: ["framer-motion"],
            seo: ["react-helmet-async"]
          }
        }
      },
      // Improve build performance and size
      target: "es2020",
      minify: "esbuild",
      sourcemap: false,
      // Disable sourcemaps in production for faster loading
      cssCodeSplit: true,
      reportCompressedSize: false
      // Faster builds
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@supabase/supabase-js",
        "lucide-react",
        "date-fns",
        "react-router-dom",
        "react-helmet-async"
      ]
      // exclude: ['@lovable-dev/lovable'] // Temporarily removed for debugging
    },
    // Reduce console noise
    logLevel: isDevelopment ? "info" : "warn",
    define: {
      __DEV__: isDevelopment,
      "process.env.NODE_ENV": JSON.stringify(mode)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3NlY3VyaXR5L3NlY3VyaXR5SGVhZGVycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2lzaGFuL3ZpY3R1cmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbmltcG9ydCB7IHNlY3VyaXR5SGVhZGVycyB9IGZyb20gXCIuL3NyYy9zZWN1cml0eS9zZWN1cml0eUhlYWRlcnNcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IHtcclxuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBtb2RlID09PSAncHJvZHVjdGlvbic7XHJcbiAgY29uc3QgaXNEZXZlbG9wbWVudCA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCI6OlwiLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgICBoZWFkZXJzOiBzZWN1cml0eUhlYWRlcnMsXHJcbiAgICAgIGNvcnM6IHRydWUsXHJcbiAgICAgIGhtcjoge1xyXG4gICAgICAgIG92ZXJsYXk6IGZhbHNlIC8vIFJlZHVjZSBjb25zb2xlIG5vaXNlIGluIGRldmVsb3BtZW50XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIGlzRGV2ZWxvcG1lbnQgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAvLyBPcHRpbWl6ZSBmb3IgcHJvZHVjdGlvbiBkZXBsb3ltZW50XHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxyXG4gICAgICAgICAgICB1aTogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JywgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnXSxcclxuICAgICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXHJcbiAgICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAgIHV0aWxzOiBbJ2RhdGUtZm5zJywgJ2x1Y2lkZS1yZWFjdCcsICdjbHN4JywgJ3RhaWx3aW5kLW1lcmdlJ10sXHJcbiAgICAgICAgICAgIGNoYXJ0czogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgICAgICBtb3Rpb246IFsnZnJhbWVyLW1vdGlvbiddLFxyXG4gICAgICAgICAgICBzZW86IFsncmVhY3QtaGVsbWV0LWFzeW5jJ11cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIEltcHJvdmUgYnVpbGQgcGVyZm9ybWFuY2UgYW5kIHNpemVcclxuICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcclxuICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uIGZvciBmYXN0ZXIgbG9hZGluZ1xyXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSwgLy8gRmFzdGVyIGJ1aWxkc1xyXG4gICAgfSxcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgJ3JlYWN0JyxcclxuICAgICAgICAncmVhY3QtZG9tJyxcclxuICAgICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcclxuICAgICAgICAnbHVjaWRlLXJlYWN0JyxcclxuICAgICAgICAnZGF0ZS1mbnMnLFxyXG4gICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgICAncmVhY3QtaGVsbWV0LWFzeW5jJ1xyXG4gICAgICBdLFxyXG4gICAgICAvLyBleGNsdWRlOiBbJ0Bsb3ZhYmxlLWRldi9sb3ZhYmxlJ10gLy8gVGVtcG9yYXJpbHkgcmVtb3ZlZCBmb3IgZGVidWdnaW5nXHJcbiAgICB9LFxyXG4gICAgLy8gUmVkdWNlIGNvbnNvbGUgbm9pc2VcclxuICAgIGxvZ0xldmVsOiBpc0RldmVsb3BtZW50ID8gJ2luZm8nIDogJ3dhcm4nLFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIF9fREVWX186IGlzRGV2ZWxvcG1lbnQsXHJcbiAgICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpXHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaXNoYW5cXFxcdmljdHVyZVxcXFxzcmNcXFxcc2VjdXJpdHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcXFxcc3JjXFxcXHNlY3VyaXR5XFxcXHNlY3VyaXR5SGVhZGVycy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaXNoYW4vdmljdHVyZS9zcmMvc2VjdXJpdHkvc2VjdXJpdHlIZWFkZXJzLnRzXCI7XHJcbi8qKlxyXG4gKiBTZWN1cml0eSBoZWFkZXJzIG1pZGRsZXdhcmUgZm9yIGVuaGFuY2luZyB3ZWJzaXRlIHNlY3VyaXR5XHJcbiAqIFRoZXNlIGhlYWRlcnMgaGVscCBwcmV2ZW50IHZhcmlvdXMgY29tbW9uIHdlYiB2dWxuZXJhYmlsaXRpZXNcclxuICovXHJcblxyXG5leHBvcnQgY29uc3Qgc2VjdXJpdHlIZWFkZXJzID0ge1xyXG4gIC8vIFByZXZlbnQgWFNTIGF0dGFja3MgYnkgY29udHJvbGxpbmcgd2hpY2ggcmVzb3VyY2VzIGNhbiBiZSBsb2FkZWRcclxuICAnQ29udGVudC1TZWN1cml0eS1Qb2xpY3knOiBgXHJcbiAgICBkZWZhdWx0LXNyYyAnc2VsZic7XHJcbiAgICBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL2pzLnNlbnRyeS1jZG4uY29tIGh0dHBzOi8vKi5pbmdlc3Quc2VudHJ5LmlvIGh0dHBzOi8vY2RuLmdwdGVuZy5jbyBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbSBodHRwczovL2Nkbi5ncHRlbmcuY287XHJcbiAgICBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly8qLnN1cGFiYXNlLmNvIHdzczovLyouc3VwYWJhc2UuY28gaHR0cHM6Ly9heXNkaWxmZ3hseXVwbGlrbW1kdC5zdXBhYmFzZS5jbyBodHRwczovLyouc2VudHJ5LmlvIGh0dHBzOi8vKi5zZW50cnktY2RuLmNvbSBodHRwczovLyouaW5nZXN0LnNlbnRyeS5pbyBodHRwczovL3RyZW5kcy5nb29nbGUuY29tIGh0dHBzOi8vbmV3c2FwaS5vcmcgaHR0cHM6Ly9hcGkud2hhdHNhcHAuY29tIGh0dHBzOi8vKi5nb29nbGVhcGlzLmNvbSBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbSBodHRwczovL2Nkbi5ncHRlbmcuY287XHJcbiAgICBpbWctc3JjICdzZWxmJyBkYXRhOiBodHRwczogYmxvYjo7XHJcbiAgICBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tO1xyXG4gICAgZm9udC1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb207XHJcbiAgICBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20gaHR0cHM6Ly93d3cueW91dHViZS5jb207XHJcbiAgICBvYmplY3Qtc3JjICdub25lJztcclxuICAgIGJhc2UtdXJpICdzZWxmJztcclxuICAgIGZvcm0tYWN0aW9uICdzZWxmJztcclxuICAgIGZyYW1lLWFuY2VzdG9ycyAnbm9uZSc7XHJcbiAgICBibG9jay1hbGwtbWl4ZWQtY29udGVudDtcclxuICAgIHVwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHM7XHJcbiAgYC5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpLFxyXG4gIFxyXG4gIC8vIFByZXZlbnQgTUlNRSB0eXBlIHNuaWZmaW5nXHJcbiAgJ1gtQ29udGVudC1UeXBlLU9wdGlvbnMnOiAnbm9zbmlmZicsXHJcbiAgXHJcbiAgLy8gQ29udHJvbCBpZnJhbWUgZW1iZWRkaW5nIC0gdXNlIENTUCBmcmFtZS1hbmNlc3RvcnMgaW5zdGVhZCBmb3IgYmV0dGVyIGNvbnRyb2xcclxuICAnWC1GcmFtZS1PcHRpb25zJzogJ1NBTUVPUklHSU4nLFxyXG4gIFxyXG4gIC8vIEFkZCBhbiBhZGRpdGlvbmFsIGxheWVyIG9mIFhTUyBwcm90ZWN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xyXG4gICdYLVhTUy1Qcm90ZWN0aW9uJzogJzE7IG1vZGU9YmxvY2snLFxyXG4gIFxyXG4gIC8vIENvbnRyb2wgaW5mb3JtYXRpb24gZXhwb3NlZCBpbiByZWZlcnJlciBoZWFkZXJcclxuICAnUmVmZXJyZXItUG9saWN5JzogJ3N0cmljdC1vcmlnaW4td2hlbi1jcm9zcy1vcmlnaW4nLFxyXG4gIFxyXG4gIC8vIEVuYWJsZSBIVFRQIFN0cmljdCBUcmFuc3BvcnQgU2VjdXJpdHkgKEhTVFMpXHJcbiAgJ1N0cmljdC1UcmFuc3BvcnQtU2VjdXJpdHknOiAnbWF4LWFnZT02MzA3MjAwMDsgaW5jbHVkZVN1YkRvbWFpbnM7IHByZWxvYWQnLFxyXG4gIFxyXG4gIC8vIFNwZWNpZnkgcGVybWl0dGVkIGNhcGFiaWxpdGllcyBmb3IgeW91ciBhcHBsaWNhdGlvblxyXG4gICdQZXJtaXNzaW9ucy1Qb2xpY3knOiAnY2FtZXJhPXNlbGYsIG1pY3JvcGhvbmU9c2VsZiwgZ2VvbG9jYXRpb249c2VsZiwgaW50ZXJlc3QtY29ob3J0PSgpJyxcclxuICBcclxuICAvLyBBbGxvdyByZXF1ZXN0cyBmcm9tIGFsbCBvcmlnaW5zIGZvciBkZXZlbG9wbWVudCBhbmQgcHJldmlldyBlbnZpcm9ubWVudHNcclxuICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgT1BUSU9OUywgUFVULCBQQVRDSCwgREVMRVRFJyxcclxuICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdYLVJlcXVlc3RlZC1XaXRoLGNvbnRlbnQtdHlwZSxBdXRob3JpemF0aW9uLFgtQ2xpZW50LUluZm8nLFxyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFscyc6ICd0cnVlJyxcclxuICBcclxuICAvLyBDYWNoZSBjb250cm9sIGZvciBpbXByb3ZlZCBwZXJmb3JtYW5jZSBhbmQgcmVkdWNlZCBmbGlja2VyaW5nXHJcbiAgJ0NhY2hlLUNvbnRyb2wnOiAncHVibGljLCBtYXgtYWdlPTMwMCwgc3RhbGUtd2hpbGUtcmV2YWxpZGF0ZT02MCcsXHJcbiAgXHJcbiAgLy8gRmVhdHVyZS1Qb2xpY3kgaGVhZGVyIGZvciBhZGRpdGlvbmFsIHNlY3VyaXR5XHJcbiAgJ0ZlYXR1cmUtUG9saWN5JzogJ2NhbWVyYSBzZWxmOyBtaWNyb3Bob25lIHNlbGY7IGdlb2xvY2F0aW9uIHNlbGY7JyxcclxufTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0UCxTQUFTLG9CQUFvQjtBQUN6UixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCOzs7QUNHekIsSUFBTSxrQkFBa0I7QUFBQTtBQUFBLEVBRTdCLDJCQUEyQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFjekIsUUFBUSxRQUFRLEdBQUcsRUFBRSxLQUFLO0FBQUE7QUFBQSxFQUc1QiwwQkFBMEI7QUFBQTtBQUFBLEVBRzFCLG1CQUFtQjtBQUFBO0FBQUEsRUFHbkIsb0JBQW9CO0FBQUE7QUFBQSxFQUdwQixtQkFBbUI7QUFBQTtBQUFBLEVBR25CLDZCQUE2QjtBQUFBO0FBQUEsRUFHN0Isc0JBQXNCO0FBQUE7QUFBQSxFQUd0QiwrQkFBK0I7QUFBQSxFQUMvQixnQ0FBZ0M7QUFBQSxFQUNoQyxnQ0FBZ0M7QUFBQSxFQUNoQyxvQ0FBb0M7QUFBQTtBQUFBLEVBR3BDLGlCQUFpQjtBQUFBO0FBQUEsRUFHakIsa0JBQWtCO0FBQ3BCOzs7QURyREEsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxTQUFTLEtBQUssTUFBTTtBQUNqRCxRQUFNLGVBQWUsU0FBUztBQUM5QixRQUFNLGdCQUFnQixTQUFTO0FBRS9CLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQTtBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDbkMsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUNoQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxNQUVMLHVCQUF1QjtBQUFBLE1BQ3ZCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUM3QixJQUFJLENBQUMsMEJBQTBCLGlDQUFpQyx3QkFBd0I7QUFBQSxZQUN4RixVQUFVLENBQUMsdUJBQXVCO0FBQUEsWUFDbEMsUUFBUSxDQUFDLGtCQUFrQjtBQUFBLFlBQzNCLE9BQU8sQ0FBQyxZQUFZLGdCQUFnQixRQUFRLGdCQUFnQjtBQUFBLFlBQzVELFFBQVEsQ0FBQyxVQUFVO0FBQUEsWUFDbkIsUUFBUSxDQUFDLGVBQWU7QUFBQSxZQUN4QixLQUFLLENBQUMsb0JBQW9CO0FBQUEsVUFDNUI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUE7QUFBQSxNQUNYLGNBQWM7QUFBQSxNQUNkLHNCQUFzQjtBQUFBO0FBQUEsSUFDeEI7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBO0FBQUEsSUFFRjtBQUFBO0FBQUEsSUFFQSxVQUFVLGdCQUFnQixTQUFTO0FBQUEsSUFDbkMsUUFBUTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1Qsd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
