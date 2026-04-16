import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { devLoginPlugin } from "./vite-dev-login";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      devLoginPlugin(),
      react(),
      VitePWA({
        registerType: "prompt",
        injectRegister: "auto",
        srcDir: "src",
        filename: "sw.ts",
        strategies: "injectManifest",
        injectManifest: {
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}",
          ],
        },
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "Red Petroleum EV",
          short_name: "Red Petroleum",
          description: "Red Petroleum EV — зарядка электромобилей в Кыргызстане",
          theme_color: "#050507",
          background_color: "#0A0E17",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          id: "kg.ocharge.app",
          categories: ["utilities", "transportation"],
          icons: [
            {
              src: "icons/manifest-icon-192.maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
          shortcuts: [
            {
              name: "Карта",
              short_name: "Карта",
              url: "/map",
              icons: [
                {
                  src: "icons/manifest-icon-192.maskable.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
                },
              ],
            },
            {
              name: "Зарядка",
              short_name: "Зарядка",
              url: "/charging",
              icons: [
                {
                  src: "icons/manifest-icon-192.maskable.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
                },
              ],
            },
            {
              name: "Поддержка",
              short_name: "Поддержка",
              url: "/support",
              icons: [
                {
                  src: "icons/manifest-icon-192.maskable.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
                },
              ],
            },
          ],
        },
        workbox: {
          navigationPreload: true,
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}",
          ],
          // Очистка старых кешей при обновлении
          cleanupOutdatedCaches: true,
          // НЕ используем skipWaiting и clientsClaim - управляем вручную
          // skipWaiting будет вызван только когда пользователь нажмет "Обновить"
          runtimeCaching: [
            // Charging, status and station endpoints - always from network
            // ВАЖНО: station/status должен быть NetworkOnly для актуальных данных коннекторов
            {
              urlPattern:
                /^https:\/\/ocpp\.charge\.redpay\.kg\/api\/v1\/(charging|status|station)\/.*/i,
              handler: "NetworkOnly",
              options: {
                cacheName: "no-cache",
              },
            },
            // General API endpoints - StaleWhileRevalidate for instant loading
            {
              urlPattern: /^https:\/\/ocpp\.charge\.redpay\.kg\/api\/.*/i,
              handler: "StaleWhileRevalidate",
              method: "GET",
              options: {
                cacheName: "api-swr",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            // Supabase API - StaleWhileRevalidate
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "StaleWhileRevalidate",
              method: "GET",
              options: {
                cacheName: "supabase-swr",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            // Payments - always from network
            {
              urlPattern: /^https:\/\/api\.dengi\.o\.kg\/.*/i,
              handler: "NetworkOnly",
            },
            // JSON / шрифты — StaleWhileRevalidate
            {
              urlPattern: /\.json$/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "json-swr" },
            },
            {
              urlPattern: /\.(woff2?|ttf|otf)$/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "fonts-swr" },
            },
            // Images - cache first
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: 3000,
      headers: {
        // DEV headers (приближены к продакшен-политике, без CSP чтобы не ломать Vite)
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
      hmr: {
        overlay: false,
      },
      proxy:
        process.env.NODE_ENV === "development"
          ? {
              "/api": {
                target: process.env.VITE_API_TARGET || "http://localhost:9210",
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: { "*": "" },
                // Пробрасываем все заголовки, включая Authorization
                configure: (proxy, _options) => {
                  proxy.on("proxyReq", (proxyReq, req, _res) => {
                    // Явно пробрасываем все нужные заголовки
                    // В Node.js заголовки всегда lowercase
                    const auth =
                      req.headers["authorization"] ||
                      req.headers["Authorization"];
                    if (auth) {
                      proxyReq.setHeader("Authorization", auth);
                    }
                    const idempKey =
                      req.headers["idempotency-key"] ||
                      req.headers["Idempotency-Key"];
                    if (idempKey) {
                      proxyReq.setHeader("Idempotency-Key", idempKey);
                    }
                    const cookie =
                      req.headers["cookie"];
                    if (cookie) {
                      proxyReq.setHeader("Cookie", cookie);
                    }
                  });
                  // Убираем Secure флаг из cookie чтобы работало на localhost без HTTPS
                  proxy.on("proxyRes", (proxyRes) => {
                    const setCookie = proxyRes.headers["set-cookie"];
                    if (setCookie) {
                      proxyRes.headers["set-cookie"] = setCookie.map((c: string) =>
                        c.replace(/;\s*Secure/gi, "").replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                      );
                    }
                  });
                },
              },
            }
          : undefined,
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["@tanstack/react-query"],
    },
  };
});
