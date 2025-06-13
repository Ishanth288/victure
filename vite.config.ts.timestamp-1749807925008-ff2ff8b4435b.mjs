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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3NlY3VyaXR5L3NlY3VyaXR5SGVhZGVycy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGlzaGFuXFxcXHZpY3R1cmVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2lzaGFuL3ZpY3R1cmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbmltcG9ydCB7IHNlY3VyaXR5SGVhZGVycyB9IGZyb20gXCIuL3NyYy9zZWN1cml0eS9zZWN1cml0eUhlYWRlcnNcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IHtcclxuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBtb2RlID09PSAncHJvZHVjdGlvbic7XHJcbiAgY29uc3QgaXNEZXZlbG9wbWVudCA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCI6OlwiLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgICBoZWFkZXJzOiBzZWN1cml0eUhlYWRlcnMsXHJcbiAgICAgIGNvcnM6IHRydWUsXHJcbiAgICAgIGhtcjoge1xyXG4gICAgICAgIG92ZXJsYXk6IGZhbHNlIC8vIFJlZHVjZSBjb25zb2xlIG5vaXNlIGluIGRldmVsb3BtZW50XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIGlzRGV2ZWxvcG1lbnQgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAvLyBPcHRpbWl6ZSBjaHVuayBzaXplc1xyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXHJcbiAgICAgICAgICAgIHVpOiBbJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnXSxcclxuICAgICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXHJcbiAgICAgICAgICAgIHV0aWxzOiBbJ2RhdGUtZm5zJywgJ2x1Y2lkZS1yZWFjdCddXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBJbXByb3ZlIGJ1aWxkIHBlcmZvcm1hbmNlXHJcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICAgIG1pbmlmeTogaXNQcm9kdWN0aW9uID8gJ2VzYnVpbGQnIDogZmFsc2UsXHJcbiAgICAgIHNvdXJjZW1hcDogaXNEZXZlbG9wbWVudCxcclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICdyZWFjdCcsXHJcbiAgICAgICAgJ3JlYWN0LWRvbScsXHJcbiAgICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsXHJcbiAgICAgICAgJ2x1Y2lkZS1yZWFjdCcsXHJcbiAgICAgICAgJ2RhdGUtZm5zJ1xyXG4gICAgICBdLFxyXG4gICAgICBleGNsdWRlOiBbJ0Bsb3ZhYmxlLWRldi9sb3ZhYmxlJ11cclxuICAgIH0sXHJcbiAgICAvLyBSZWR1Y2UgY29uc29sZSBub2lzZVxyXG4gICAgbG9nTGV2ZWw6IGlzRGV2ZWxvcG1lbnQgPyAnaW5mbycgOiAnd2FybicsXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19ERVZfXzogaXNEZXZlbG9wbWVudCxcclxuICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSlcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxpc2hhblxcXFx2aWN0dXJlXFxcXHNyY1xcXFxzZWN1cml0eVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcaXNoYW5cXFxcdmljdHVyZVxcXFxzcmNcXFxcc2VjdXJpdHlcXFxcc2VjdXJpdHlIZWFkZXJzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9pc2hhbi92aWN0dXJlL3NyYy9zZWN1cml0eS9zZWN1cml0eUhlYWRlcnMudHNcIjtcclxuLyoqXHJcbiAqIFNlY3VyaXR5IGhlYWRlcnMgbWlkZGxld2FyZSBmb3IgZW5oYW5jaW5nIHdlYnNpdGUgc2VjdXJpdHlcclxuICogVGhlc2UgaGVhZGVycyBoZWxwIHByZXZlbnQgdmFyaW91cyBjb21tb24gd2ViIHZ1bG5lcmFiaWxpdGllc1xyXG4gKi9cclxuXHJcbmV4cG9ydCBjb25zdCBzZWN1cml0eUhlYWRlcnMgPSB7XHJcbiAgLy8gUHJldmVudCBYU1MgYXR0YWNrcyBieSBjb250cm9sbGluZyB3aGljaCByZXNvdXJjZXMgY2FuIGJlIGxvYWRlZFxyXG4gICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6IGBcclxuICAgIGRlZmF1bHQtc3JjICdzZWxmJztcclxuICAgIHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIGh0dHBzOi8vanMuc2VudHJ5LWNkbi5jb20gaHR0cHM6Ly8qLmluZ2VzdC5zZW50cnkuaW8gaHR0cHM6Ly9jZG4uZ3B0ZW5nLmNvIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vY2RuLmdwdGVuZy5jbztcclxuICAgIGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovLyouc3VwYWJhc2UuY28gd3NzOi8vKi5zdXBhYmFzZS5jbyBodHRwczovL2F5c2RpbGZneGx5dXBsaWttbWR0LnN1cGFiYXNlLmNvIGh0dHBzOi8vKi5zZW50cnkuaW8gaHR0cHM6Ly8qLnNlbnRyeS1jZG4uY29tIGh0dHBzOi8vKi5pbmdlc3Quc2VudHJ5LmlvIGh0dHBzOi8vdHJlbmRzLmdvb2dsZS5jb20gaHR0cHM6Ly9uZXdzYXBpLm9yZyBodHRwczovL2FwaS53aGF0c2FwcC5jb20gaHR0cHM6Ly8qLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vY2RuLmdwdGVuZy5jbztcclxuICAgIGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOiBibG9iOjtcclxuICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb207XHJcbiAgICBmb250LXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTtcclxuICAgIGZyYW1lLXNyYyAnc2VsZicgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbSBodHRwczovL3d3dy55b3V0dWJlLmNvbTtcclxuICAgIG9iamVjdC1zcmMgJ25vbmUnO1xyXG4gICAgYmFzZS11cmkgJ3NlbGYnO1xyXG4gICAgZm9ybS1hY3Rpb24gJ3NlbGYnO1xyXG4gICAgZnJhbWUtYW5jZXN0b3JzICdub25lJztcclxuICAgIGJsb2NrLWFsbC1taXhlZC1jb250ZW50O1xyXG4gICAgdXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cztcclxuICBgLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCksXHJcbiAgXHJcbiAgLy8gUHJldmVudCBNSU1FIHR5cGUgc25pZmZpbmdcclxuICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcclxuICBcclxuICAvLyBDb250cm9sIGlmcmFtZSBlbWJlZGRpbmcgLSB1c2UgQ1NQIGZyYW1lLWFuY2VzdG9ycyBpbnN0ZWFkIGZvciBiZXR0ZXIgY29udHJvbFxyXG4gICdYLUZyYW1lLU9wdGlvbnMnOiAnU0FNRU9SSUdJTicsXHJcbiAgXHJcbiAgLy8gQWRkIGFuIGFkZGl0aW9uYWwgbGF5ZXIgb2YgWFNTIHByb3RlY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcbiAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXHJcbiAgXHJcbiAgLy8gQ29udHJvbCBpbmZvcm1hdGlvbiBleHBvc2VkIGluIHJlZmVycmVyIGhlYWRlclxyXG4gICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXHJcbiAgXHJcbiAgLy8gRW5hYmxlIEhUVFAgU3RyaWN0IFRyYW5zcG9ydCBTZWN1cml0eSAoSFNUUylcclxuICAnU3RyaWN0LVRyYW5zcG9ydC1TZWN1cml0eSc6ICdtYXgtYWdlPTYzMDcyMDAwOyBpbmNsdWRlU3ViRG9tYWluczsgcHJlbG9hZCcsXHJcbiAgXHJcbiAgLy8gU3BlY2lmeSBwZXJtaXR0ZWQgY2FwYWJpbGl0aWVzIGZvciB5b3VyIGFwcGxpY2F0aW9uXHJcbiAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9c2VsZiwgbWljcm9waG9uZT1zZWxmLCBnZW9sb2NhdGlvbj1zZWxmLCBpbnRlcmVzdC1jb2hvcnQ9KCknLFxyXG4gIFxyXG4gIC8vIEFsbG93IHJlcXVlc3RzIGZyb20gYWxsIG9yaWdpbnMgZm9yIGRldmVsb3BtZW50IGFuZCBwcmV2aWV3IGVudmlyb25tZW50c1xyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBPUFRJT05TLCBQVVQsIFBBVENILCBERUxFVEUnLFxyXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ1gtUmVxdWVzdGVkLVdpdGgsY29udGVudC10eXBlLEF1dGhvcml6YXRpb24sWC1DbGllbnQtSW5mbycsXHJcbiAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogJ3RydWUnLFxyXG4gIFxyXG4gIC8vIENhY2hlIGNvbnRyb2wgZm9yIGltcHJvdmVkIHBlcmZvcm1hbmNlIGFuZCByZWR1Y2VkIGZsaWNrZXJpbmdcclxuICAnQ2FjaGUtQ29udHJvbCc6ICdwdWJsaWMsIG1heC1hZ2U9MzAwLCBzdGFsZS13aGlsZS1yZXZhbGlkYXRlPTYwJyxcclxuICBcclxuICAvLyBGZWF0dXJlLVBvbGljeSBoZWFkZXIgZm9yIGFkZGl0aW9uYWwgc2VjdXJpdHlcclxuICAnRmVhdHVyZS1Qb2xpY3knOiAnY2FtZXJhIHNlbGY7IG1pY3JvcGhvbmUgc2VsZjsgZ2VvbG9jYXRpb24gc2VsZjsnLFxyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRQLFNBQVMsb0JBQW9CO0FBQ3pSLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7OztBQ0d6QixJQUFNLGtCQUFrQjtBQUFBO0FBQUEsRUFFN0IsMkJBQTJCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQWN6QixRQUFRLFFBQVEsR0FBRyxFQUFFLEtBQUs7QUFBQTtBQUFBLEVBRzVCLDBCQUEwQjtBQUFBO0FBQUEsRUFHMUIsbUJBQW1CO0FBQUE7QUFBQSxFQUduQixvQkFBb0I7QUFBQTtBQUFBLEVBR3BCLG1CQUFtQjtBQUFBO0FBQUEsRUFHbkIsNkJBQTZCO0FBQUE7QUFBQSxFQUc3QixzQkFBc0I7QUFBQTtBQUFBLEVBR3RCLCtCQUErQjtBQUFBLEVBQy9CLGdDQUFnQztBQUFBLEVBQ2hDLGdDQUFnQztBQUFBLEVBQ2hDLG9DQUFvQztBQUFBO0FBQUEsRUFHcEMsaUJBQWlCO0FBQUE7QUFBQSxFQUdqQixrQkFBa0I7QUFDcEI7OztBRHJEQSxJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNO0FBQ2pELFFBQU0sZUFBZSxTQUFTO0FBQzlCLFFBQU0sZ0JBQWdCLFNBQVM7QUFFL0IsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsTUFBTTtBQUFBLE1BQ04sS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUNuQyxFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFlBQzdCLElBQUksQ0FBQywwQkFBMEIsK0JBQStCO0FBQUEsWUFDOUQsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFlBQ2xDLE9BQU8sQ0FBQyxZQUFZLGNBQWM7QUFBQSxVQUNwQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLFFBQVE7QUFBQSxNQUNSLFFBQVEsZUFBZSxZQUFZO0FBQUEsTUFDbkMsV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVMsQ0FBQyxzQkFBc0I7QUFBQSxJQUNsQztBQUFBO0FBQUEsSUFFQSxVQUFVLGdCQUFnQixTQUFTO0FBQUEsSUFDbkMsUUFBUTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1Qsd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
