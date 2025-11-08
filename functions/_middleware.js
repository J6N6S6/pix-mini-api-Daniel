// functions/_middleware.js
// Cloudflare Pages Functions — CORS dinâmico via env CORS_ORIGIN
// Exemplo de env: CORS_ORIGIN="http://localhost:3000,https://seusite.com,https://cliente1.com"

const corsEnv = (typeof process !== "undefined" && process.env.CORS_ORIGIN) || "";
const allowAll = corsEnv.trim() === "*";

function normalize(s = "") {
  return String(s).trim().replace(/\/+$/, ""); // remove barra final
}

const allowedOrigins = new Set(
  allowAll
    ? [] // ignorado quando "*"
    : corsEnv
        .split(",")
        .map(s => normalize(s))
        .filter(Boolean)
);

function getAllowedOrigin(request) {
  const origin = normalize(request.headers.get("Origin"));
  if (!origin) return "";
  if (allowAll) return origin;          // modo curinga (apenas se CORS_ORIGIN="*")
  if (allowedOrigins.has(origin)) return origin;
  return "";                            // bloqueia se não listado
}

// Preflight (OPTIONS)
export const onRequestOptions = async ({ request }) => {
  const allowOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin, Vary: "Origin" } : {}),
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,Idempotency-Key,x-api-token",
      "Access-Control-Max-Age": "86400"
    }
  });
};

// Aplica CORS em todas as respostas
export const onRequest = async ({ request, next }) => {
  const res = await next();
  const allowOrigin = getAllowedOrigin(request);
  const headers = new Headers(res.headers);
  if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers });
};
