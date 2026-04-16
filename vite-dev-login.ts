/**
 * Vite dev server plugin: /api/v1/auth/dev-login
 * Генерирует JWT токены локально для быстрого входа без OTP.
 * Работает ТОЛЬКО в dev server (не попадает в production bundle).
 */
import type { Plugin } from "vite";
import jwt from "jsonwebtoken";

const SECRET_KEY = "7B34Ax6Z1yli1BWHK2bPLBX0LrI8Y1Hw";
const ACCESS_TTL = 24 * 3600; // 24 часа
const REFRESH_TTL = 7 * 24 * 3600; // 7 дней

function mintJwt(userId: string, ttl: number, type: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { sub: userId, iat: now, exp: now + ttl, typ: type, iss: "redpetroleum-backend" },
    SECRET_KEY,
    { algorithm: "HS256" },
  );
}

export function devLoginPlugin(): Plugin {
  return {
    name: "dev-login",
    configureServer(server) {
      server.middlewares.use("/api/v1/auth/dev-login", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const { user_id } = JSON.parse(body);
            if (!user_id) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "user_id required" }));
              return;
            }

            const accessToken = mintJwt(user_id, ACCESS_TTL, "access");
            const refreshToken = mintJwt(user_id, REFRESH_TTL, "refresh");

            // Set cookies (no Secure, SameSite=Lax for localhost)
            res.setHeader("Set-Cookie", [
              `evp_access=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_TTL}`,
              `evp_refresh=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_TTL}`,
            ]);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: true,
                message: "Dev login successful",
                user_id,
                user_type: "owner",
              }),
            );
          } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}
