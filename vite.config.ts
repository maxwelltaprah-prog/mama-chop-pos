import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["eidikos-logo.jpeg", "favicon.ico"],
      manifest: {
        name: "Eidikos Kouzina",
        short_name: "Eidikos",
        description: "Eidikos Kouzina - Restaurant POS & Online Ordering",
        theme_color: "#f59e0b",
        background_color: "#0a0a0b",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpeg,jpg,woff,woff2}"],
        // Important: only cache SAFE (GET) requests.
        // Caching all backend requests can break order placement on mobile/PWA.
        runtimeCaching: [
          {
            // Cache menu catalog reads for faster mobile browsing
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/menu_items(\?.*)?$/i,
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "menu-items-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 6, // 6 hours
              },
            },
          },
          {
            // Cache menu images (public bucket)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/menu-images\/.*/i,
            handler: "CacheFirst",
            method: "GET",
            options: {
              cacheName: "menu-images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
