// vite.config.ts
import { defineConfig } from "file:///C:/Users/ishan/victure/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ishan/victure/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/ishan/victure/node_modules/lovable-tagger/dist/index.js";
import { sentryVitePlugin } from "file:///C:/Users/ishan/victure/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";

// src/security/securityHeaders.ts
var securityHeaders = {
  // Prevent XSS attacks by controlling which resources can be loaded
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://*.ingest.sentry.io https://cdn.gpteng.co;
    connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.sentry-cdn.com https://*.ingest.sentry.io https://trends.google.com https://newsapi.org https://api.whatsapp.com;
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
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
    cors: true
  },
  plugins: [
    react({
      jsxImportSource: "react",
      // Remove the plugin that's causing issues
      plugins: []
    }),
    mode === "development" && componentTagger(),
    sentryVitePlugin({
      org: "victure-pharmacy",
      project: "victure-pharmacy",
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and should be stored in environment variables
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only generate source maps and upload them when in production
      disable: mode !== "production"
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Generate source maps in production
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" || warning.message.includes('The "this" keyword is equivalent to "undefined"')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3NlY3VyaXR5L3NlY3VyaXR5SGVhZGVycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2lzaGFuL3ZpY3R1cmUvdml0ZS5jb25maWcudHNcIjtcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IHNlbnRyeVZpdGVQbHVnaW4gfSBmcm9tIFwiQHNlbnRyeS92aXRlLXBsdWdpblwiO1xyXG5pbXBvcnQgeyBzZWN1cml0eUhlYWRlcnMgfSBmcm9tIFwiLi9zcmMvc2VjdXJpdHkvc2VjdXJpdHlIZWFkZXJzXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhlYWRlcnM6IHNlY3VyaXR5SGVhZGVycyxcclxuICAgIGNvcnM6IHRydWVcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KHtcclxuICAgICAganN4SW1wb3J0U291cmNlOiBcInJlYWN0XCIsXHJcbiAgICAgIC8vIFJlbW92ZSB0aGUgcGx1Z2luIHRoYXQncyBjYXVzaW5nIGlzc3Vlc1xyXG4gICAgICBwbHVnaW5zOiBbXVxyXG4gICAgfSksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xyXG4gICAgICBvcmc6IFwidmljdHVyZS1waGFybWFjeVwiLFxyXG4gICAgICBwcm9qZWN0OiBcInZpY3R1cmUtcGhhcm1hY3lcIixcclxuICAgICAgLy8gQXV0aCB0b2tlbnMgY2FuIGJlIG9idGFpbmVkIGZyb20gaHR0cHM6Ly9zZW50cnkuaW8vc2V0dGluZ3MvYWNjb3VudC9hcGkvYXV0aC10b2tlbnMvXHJcbiAgICAgIC8vIGFuZCBzaG91bGQgYmUgc3RvcmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG4gICAgICBhdXRoVG9rZW46IHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxyXG4gICAgICBcclxuICAgICAgLy8gT25seSBnZW5lcmF0ZSBzb3VyY2UgbWFwcyBhbmQgdXBsb2FkIHRoZW0gd2hlbiBpbiBwcm9kdWN0aW9uXHJcbiAgICAgIGRpc2FibGU6IG1vZGUgIT09ICdwcm9kdWN0aW9uJyxcclxuICAgIH0pLFxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIC8vIEdlbmVyYXRlIHNvdXJjZSBtYXBzIGluIHByb2R1Y3Rpb25cclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvbndhcm4od2FybmluZywgd2Fybikge1xyXG4gICAgICAgIC8vIFN1cHByZXNzIGNlcnRhaW4gd2FybmluZ3NcclxuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnTU9EVUxFX0xFVkVMX0RJUkVDVElWRScgfHwgXHJcbiAgICAgICAgICAgIHdhcm5pbmcubWVzc2FnZS5pbmNsdWRlcygnVGhlIFwidGhpc1wiIGtleXdvcmQgaXMgZXF1aXZhbGVudCB0byBcInVuZGVmaW5lZFwiJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2Fybih3YXJuaW5nKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICBkZWZpbmU6IHtcclxuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaXNoYW5cXFxcdmljdHVyZVxcXFxzcmNcXFxcc2VjdXJpdHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcXFxcc3JjXFxcXHNlY3VyaXR5XFxcXHNlY3VyaXR5SGVhZGVycy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvaXNoYW4vdmljdHVyZS9zcmMvc2VjdXJpdHkvc2VjdXJpdHlIZWFkZXJzLnRzXCI7XHJcbi8qKlxyXG4gKiBTZWN1cml0eSBoZWFkZXJzIG1pZGRsZXdhcmUgZm9yIGVuaGFuY2luZyB3ZWJzaXRlIHNlY3VyaXR5XHJcbiAqIFRoZXNlIGhlYWRlcnMgaGVscCBwcmV2ZW50IHZhcmlvdXMgY29tbW9uIHdlYiB2dWxuZXJhYmlsaXRpZXNcclxuICovXHJcblxyXG5leHBvcnQgY29uc3Qgc2VjdXJpdHlIZWFkZXJzID0ge1xyXG4gIC8vIFByZXZlbnQgWFNTIGF0dGFja3MgYnkgY29udHJvbGxpbmcgd2hpY2ggcmVzb3VyY2VzIGNhbiBiZSBsb2FkZWRcclxuICAnQ29udGVudC1TZWN1cml0eS1Qb2xpY3knOiBgXHJcbiAgICBkZWZhdWx0LXNyYyAnc2VsZic7XHJcbiAgICBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL2pzLnNlbnRyeS1jZG4uY29tIGh0dHBzOi8vKi5pbmdlc3Quc2VudHJ5LmlvIGh0dHBzOi8vY2RuLmdwdGVuZy5jbztcclxuICAgIGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovLyouc3VwYWJhc2UuY28gaHR0cHM6Ly8qLnNlbnRyeS5pbyBodHRwczovLyouc2VudHJ5LWNkbi5jb20gaHR0cHM6Ly8qLmluZ2VzdC5zZW50cnkuaW8gaHR0cHM6Ly90cmVuZHMuZ29vZ2xlLmNvbSBodHRwczovL25ld3NhcGkub3JnIGh0dHBzOi8vYXBpLndoYXRzYXBwLmNvbTtcclxuICAgIGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOiBibG9iOjtcclxuICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb207XHJcbiAgICBmb250LXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTtcclxuICAgIGZyYW1lLXNyYyAnc2VsZicgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSBodHRwczovL3d3dy55b3V0dWJlLmNvbTtcclxuICAgIG9iamVjdC1zcmMgJ25vbmUnO1xyXG4gICAgYmFzZS11cmkgJ3NlbGYnO1xyXG4gICAgZm9ybS1hY3Rpb24gJ3NlbGYnO1xyXG4gICAgZnJhbWUtYW5jZXN0b3JzICdub25lJztcclxuICAgIGJsb2NrLWFsbC1taXhlZC1jb250ZW50O1xyXG4gICAgdXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cztcclxuICBgLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCksXHJcbiAgXHJcbiAgLy8gUHJldmVudCBNSU1FIHR5cGUgc25pZmZpbmdcclxuICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcclxuICBcclxuICAvLyBDb250cm9sIGlmcmFtZSBlbWJlZGRpbmcgLSB1c2UgQ1NQIGZyYW1lLWFuY2VzdG9ycyBpbnN0ZWFkIGZvciBiZXR0ZXIgY29udHJvbFxyXG4gICdYLUZyYW1lLU9wdGlvbnMnOiAnU0FNRU9SSUdJTicsXHJcbiAgXHJcbiAgLy8gQWRkIGFuIGFkZGl0aW9uYWwgbGF5ZXIgb2YgWFNTIHByb3RlY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcbiAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXHJcbiAgXHJcbiAgLy8gQ29udHJvbCBpbmZvcm1hdGlvbiBleHBvc2VkIGluIHJlZmVycmVyIGhlYWRlclxyXG4gICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXHJcbiAgXHJcbiAgLy8gRW5hYmxlIEhUVFAgU3RyaWN0IFRyYW5zcG9ydCBTZWN1cml0eSAoSFNUUylcclxuICAnU3RyaWN0LVRyYW5zcG9ydC1TZWN1cml0eSc6ICdtYXgtYWdlPTYzMDcyMDAwOyBpbmNsdWRlU3ViRG9tYWluczsgcHJlbG9hZCcsXHJcbiAgXHJcbiAgLy8gU3BlY2lmeSBwZXJtaXR0ZWQgY2FwYWJpbGl0aWVzIGZvciB5b3VyIGFwcGxpY2F0aW9uXHJcbiAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9c2VsZiwgbWljcm9waG9uZT1zZWxmLCBnZW9sb2NhdGlvbj1zZWxmLCBpbnRlcmVzdC1jb2hvcnQ9KCknLFxyXG4gIFxyXG4gIC8vIEFsbG93IHJlcXVlc3RzIGZyb20gYWxsIG9yaWdpbnMgZm9yIGRldmVsb3BtZW50IGFuZCBwcmV2aWV3IGVudmlyb25tZW50c1xyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBPUFRJT05TLCBQVVQsIFBBVENILCBERUxFVEUnLFxyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ1gtUmVxdWVzdGVkLVdpdGgsY29udGVudC10eXBlLEF1dGhvcml6YXRpb24sWC1DbGllbnQtSW5mbycsXHJcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogJ3RydWUnLFxyXG4gIFxyXG4gIC8vIENhY2hlIGNvbnRyb2wgZm9yIGltcHJvdmVkIHBlcmZvcm1hbmNlIGFuZCByZWR1Y2VkIGZsaWNrZXJpbmdcclxuICAnQ2FjaGUtQ29udHJvbCc6ICdwdWJsaWMsIG1heC1hZ2U9MzAwLCBzdGFsZS13aGlsZS1yZXZhbGlkYXRlPTYwJyxcclxuICBcclxuICAvLyBGZWF0dXJlLVBvbGljeSBoZWFkZXIgZm9yIGFkZGl0aW9uYWwgc2VjdXJpdHlcclxuICAnRmVhdHVyZS1Qb2xpY3knOiAnY2FtZXJhIHNlbGY7IG1pY3JvcGhvbmUgc2VsZjsgZ2VvbG9jYXRpb24gc2VsZjsnLFxyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHdCQUF3Qjs7O0FDQzFCLElBQU0sa0JBQWtCO0FBQUE7QUFBQSxFQUU3QiwyQkFBMkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBY3pCLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSztBQUFBO0FBQUEsRUFHNUIsMEJBQTBCO0FBQUE7QUFBQSxFQUcxQixtQkFBbUI7QUFBQTtBQUFBLEVBR25CLG9CQUFvQjtBQUFBO0FBQUEsRUFHcEIsbUJBQW1CO0FBQUE7QUFBQSxFQUduQiw2QkFBNkI7QUFBQTtBQUFBLEVBRzdCLHNCQUFzQjtBQUFBO0FBQUEsRUFHdEIsK0JBQStCO0FBQUEsRUFDL0IsZ0NBQWdDO0FBQUEsRUFDaEMsZ0NBQWdDO0FBQUEsRUFDaEMsb0NBQW9DO0FBQUE7QUFBQSxFQUdwQyxpQkFBaUI7QUFBQTtBQUFBLEVBR2pCLGtCQUFrQjtBQUNwQjs7O0FEckRBLElBQU0sbUNBQW1DO0FBU3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLGlCQUFpQjtBQUFBO0FBQUEsTUFFakIsU0FBUyxDQUFDO0FBQUEsSUFDWixDQUFDO0FBQUEsSUFDRCxTQUFTLGlCQUNULGdCQUFnQjtBQUFBLElBQ2hCLGlCQUFpQjtBQUFBLE1BQ2YsS0FBSztBQUFBLE1BQ0wsU0FBUztBQUFBO0FBQUE7QUFBQSxNQUdULFdBQVcsUUFBUSxJQUFJO0FBQUE7QUFBQSxNQUd2QixTQUFTLFNBQVM7QUFBQSxJQUNwQixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsT0FBTyxTQUFTLE1BQU07QUFFcEIsWUFBSSxRQUFRLFNBQVMsNEJBQ2pCLFFBQVEsUUFBUSxTQUFTLGlEQUFpRCxHQUFHO0FBQy9FO0FBQUEsUUFDRjtBQUNBLGFBQUssT0FBTztBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
