// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";

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
var __vite_injected_original_dirname = "/home/project";
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
      // Optimize chunk sizes
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
            supabase: ["@supabase/supabase-js"],
            utils: ["date-fns", "lucide-react"]
          }
        }
      },
      // Improve build performance
      target: "esnext",
      minify: isProduction ? "esbuild" : false,
      sourcemap: isDevelopment
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@supabase/supabase-js",
        "lucide-react",
        "date-fns"
      ],
      exclude: ["@lovable-dev/lovable"]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3NlY3VyaXR5L3NlY3VyaXR5SGVhZGVycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG5pbXBvcnQgeyBzZWN1cml0eUhlYWRlcnMgfSBmcm9tIFwiLi9zcmMvc2VjdXJpdHkvc2VjdXJpdHlIZWFkZXJzXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCwgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzUHJvZHVjdGlvbiA9IG1vZGUgPT09ICdwcm9kdWN0aW9uJztcbiAgY29uc3QgaXNEZXZlbG9wbWVudCA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgICBoZWFkZXJzOiBzZWN1cml0eUhlYWRlcnMsXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIG92ZXJsYXk6IGZhbHNlIC8vIFJlZHVjZSBjb25zb2xlIG5vaXNlIGluIGRldmVsb3BtZW50XG4gICAgICB9XG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgaXNEZXZlbG9wbWVudCAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgLy8gT3B0aW1pemUgY2h1bmsgc2l6ZXNcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgICB1aTogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51J10sXG4gICAgICAgICAgICBzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICAgIHV0aWxzOiBbJ2RhdGUtZm5zJywgJ2x1Y2lkZS1yZWFjdCddXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gSW1wcm92ZSBidWlsZCBwZXJmb3JtYW5jZVxuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICAgIG1pbmlmeTogaXNQcm9kdWN0aW9uID8gJ2VzYnVpbGQnIDogZmFsc2UsXG4gICAgICBzb3VyY2VtYXA6IGlzRGV2ZWxvcG1lbnQsXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgJ3JlYWN0JyxcbiAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLFxuICAgICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICAgJ2RhdGUtZm5zJ1xuICAgICAgXSxcbiAgICAgIGV4Y2x1ZGU6IFsnQGxvdmFibGUtZGV2L2xvdmFibGUnXVxuICAgIH0sXG4gICAgLy8gUmVkdWNlIGNvbnNvbGUgbm9pc2VcbiAgICBsb2dMZXZlbDogaXNEZXZlbG9wbWVudCA/ICdpbmZvJyA6ICd3YXJuJyxcbiAgICBkZWZpbmU6IHtcbiAgICAgIF9fREVWX186IGlzRGV2ZWxvcG1lbnQsXG4gICAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShtb2RlKVxuICAgIH1cbiAgfTtcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NyYy9zZWN1cml0eVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zcmMvc2VjdXJpdHkvc2VjdXJpdHlIZWFkZXJzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc3JjL3NlY3VyaXR5L3NlY3VyaXR5SGVhZGVycy50c1wiO1xuLyoqXG4gKiBTZWN1cml0eSBoZWFkZXJzIG1pZGRsZXdhcmUgZm9yIGVuaGFuY2luZyB3ZWJzaXRlIHNlY3VyaXR5XG4gKiBUaGVzZSBoZWFkZXJzIGhlbHAgcHJldmVudCB2YXJpb3VzIGNvbW1vbiB3ZWIgdnVsbmVyYWJpbGl0aWVzXG4gKi9cblxuZXhwb3J0IGNvbnN0IHNlY3VyaXR5SGVhZGVycyA9IHtcbiAgLy8gUHJldmVudCBYU1MgYXR0YWNrcyBieSBjb250cm9sbGluZyB3aGljaCByZXNvdXJjZXMgY2FuIGJlIGxvYWRlZFxuICAnQ29udGVudC1TZWN1cml0eS1Qb2xpY3knOiBgXG4gICAgZGVmYXVsdC1zcmMgJ3NlbGYnO1xuICAgIHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIGh0dHBzOi8vanMuc2VudHJ5LWNkbi5jb20gaHR0cHM6Ly8qLmluZ2VzdC5zZW50cnkuaW8gaHR0cHM6Ly9jZG4uZ3B0ZW5nLmNvIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vY2RuLmdwdGVuZy5jbztcbiAgICBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly8qLnN1cGFiYXNlLmNvIHdzczovLyouc3VwYWJhc2UuY28gaHR0cHM6Ly9heXNkaWxmZ3hseXVwbGlrbW1kdC5zdXBhYmFzZS5jbyBodHRwczovLyouc2VudHJ5LmlvIGh0dHBzOi8vKi5zZW50cnktY2RuLmNvbSBodHRwczovLyouaW5nZXN0LnNlbnRyeS5pbyBodHRwczovL3RyZW5kcy5nb29nbGUuY29tIGh0dHBzOi8vbmV3c2FwaS5vcmcgaHR0cHM6Ly9hcGkud2hhdHNhcHAuY29tIGh0dHBzOi8vKi5nb29nbGVhcGlzLmNvbSBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbSBodHRwczovL2Nkbi5ncHRlbmcuY287XG4gICAgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6IGJsb2I6O1xuICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb207XG4gICAgZm9udC1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb207XG4gICAgZnJhbWUtc3JjICdzZWxmJyBodHRwczovL3d3dy5nb29nbGUuY29tIGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tO1xuICAgIG9iamVjdC1zcmMgJ25vbmUnO1xuICAgIGJhc2UtdXJpICdzZWxmJztcbiAgICBmb3JtLWFjdGlvbiAnc2VsZic7XG4gICAgZnJhbWUtYW5jZXN0b3JzICdub25lJztcbiAgICBibG9jay1hbGwtbWl4ZWQtY29udGVudDtcbiAgICB1cGdyYWRlLWluc2VjdXJlLXJlcXVlc3RzO1xuICBgLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCksXG4gIFxuICAvLyBQcmV2ZW50IE1JTUUgdHlwZSBzbmlmZmluZ1xuICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcbiAgXG4gIC8vIENvbnRyb2wgaWZyYW1lIGVtYmVkZGluZyAtIHVzZSBDU1AgZnJhbWUtYW5jZXN0b3JzIGluc3RlYWQgZm9yIGJldHRlciBjb250cm9sXG4gICdYLUZyYW1lLU9wdGlvbnMnOiAnU0FNRU9SSUdJTicsXG4gIFxuICAvLyBBZGQgYW4gYWRkaXRpb25hbCBsYXllciBvZiBYU1MgcHJvdGVjdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXG4gIFxuICAvLyBDb250cm9sIGluZm9ybWF0aW9uIGV4cG9zZWQgaW4gcmVmZXJyZXIgaGVhZGVyXG4gICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXG4gIFxuICAvLyBFbmFibGUgSFRUUCBTdHJpY3QgVHJhbnNwb3J0IFNlY3VyaXR5IChIU1RTKVxuICAnU3RyaWN0LVRyYW5zcG9ydC1TZWN1cml0eSc6ICdtYXgtYWdlPTYzMDcyMDAwOyBpbmNsdWRlU3ViRG9tYWluczsgcHJlbG9hZCcsXG4gIFxuICAvLyBTcGVjaWZ5IHBlcm1pdHRlZCBjYXBhYmlsaXRpZXMgZm9yIHlvdXIgYXBwbGljYXRpb25cbiAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9c2VsZiwgbWljcm9waG9uZT1zZWxmLCBnZW9sb2NhdGlvbj1zZWxmLCBpbnRlcmVzdC1jb2hvcnQ9KCknLFxuICBcbiAgLy8gQWxsb3cgcmVxdWVzdHMgZnJvbSBhbGwgb3JpZ2lucyBmb3IgZGV2ZWxvcG1lbnQgYW5kIHByZXZpZXcgZW52aXJvbm1lbnRzXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgT1BUSU9OUywgUFVULCBQQVRDSCwgREVMRVRFJyxcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnWC1SZXF1ZXN0ZWQtV2l0aCxjb250ZW50LXR5cGUsQXV0aG9yaXphdGlvbixYLUNsaWVudC1JbmZvJyxcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogJ3RydWUnLFxuICBcbiAgLy8gQ2FjaGUgY29udHJvbCBmb3IgaW1wcm92ZWQgcGVyZm9ybWFuY2UgYW5kIHJlZHVjZWQgZmxpY2tlcmluZ1xuICAnQ2FjaGUtQ29udHJvbCc6ICdwdWJsaWMsIG1heC1hZ2U9MzAwLCBzdGFsZS13aGlsZS1yZXZhbGlkYXRlPTYwJyxcbiAgXG4gIC8vIEZlYXR1cmUtUG9saWN5IGhlYWRlciBmb3IgYWRkaXRpb25hbCBzZWN1cml0eVxuICAnRmVhdHVyZS1Qb2xpY3knOiAnY2FtZXJhIHNlbGY7IG1pY3JvcGhvbmUgc2VsZjsgZ2VvbG9jYXRpb24gc2VsZjsnLFxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1Qjs7O0FDR3pCLElBQU0sa0JBQWtCO0FBQUE7QUFBQSxFQUU3QiwyQkFBMkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBY3pCLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSztBQUFBO0FBQUEsRUFHNUIsMEJBQTBCO0FBQUE7QUFBQSxFQUcxQixtQkFBbUI7QUFBQTtBQUFBLEVBR25CLG9CQUFvQjtBQUFBO0FBQUEsRUFHcEIsbUJBQW1CO0FBQUE7QUFBQSxFQUduQiw2QkFBNkI7QUFBQTtBQUFBLEVBRzdCLHNCQUFzQjtBQUFBO0FBQUEsRUFHdEIsK0JBQStCO0FBQUEsRUFDL0IsZ0NBQWdDO0FBQUEsRUFDaEMsZ0NBQWdDO0FBQUEsRUFDaEMsb0NBQW9DO0FBQUE7QUFBQSxFQUdwQyxpQkFBaUI7QUFBQTtBQUFBLEVBR2pCLGtCQUFrQjtBQUNwQjs7O0FEckRBLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsU0FBUyxLQUFLLE1BQU07QUFDakQsUUFBTSxlQUFlLFNBQVM7QUFDOUIsUUFBTSxnQkFBZ0IsU0FBUztBQUUvQixTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUE7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04saUJBQWlCLGdCQUFnQjtBQUFBLElBQ25DLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDaEIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBO0FBQUEsTUFFTCx1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsWUFDN0IsSUFBSSxDQUFDLDBCQUEwQiwrQkFBK0I7QUFBQSxZQUM5RCxVQUFVLENBQUMsdUJBQXVCO0FBQUEsWUFDbEMsT0FBTyxDQUFDLFlBQVksY0FBYztBQUFBLFVBQ3BDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsUUFBUTtBQUFBLE1BQ1IsUUFBUSxlQUFlLFlBQVk7QUFBQSxNQUNuQyxXQUFXO0FBQUEsSUFDYjtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1osU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUyxDQUFDLHNCQUFzQjtBQUFBLElBQ2xDO0FBQUE7QUFBQSxJQUVBLFVBQVUsZ0JBQWdCLFNBQVM7QUFBQSxJQUNuQyxRQUFRO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCx3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxJQUM3QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
