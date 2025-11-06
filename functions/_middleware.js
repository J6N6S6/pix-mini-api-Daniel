// functions/_middleware.js
// CORS para Cloudflare Pages Functions

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.0.11:3000",
  // "https://seu-checkout-will.vercel.app",
  // "https://www.seudominio.com",
]);

// Remove barra final, espaços etc.
const normalize = (s = "") => String(s).trim().replace(/\/+$/, "");

function getAllowedOrigin(request) {
  const origin = normalize(request.headers.get("Origin"));
  if (allowedOrigins.has(origin)) return origin;
  // Durante DEV você pode liberar tudo:
  // return origin || "";
  // Ou manter um fallback seguro:
  return ""; // sem header quando não é permitido
}

// Preflight (OPTIONS)
export const onRequestOptions = async ({ request }) => {
  const allowOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin, "Vary": "Origin" } : {}),
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Idempotency-Key, x-api-token",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// Demais métodos
export const onRequest = async ({ request, next }) => {
  const res = await next();
  const allowOrigin = getAllowedOrigin(request);

  const headers = new Headers(res.headers);
  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
  } else {
    headers.delete("Access-Control-Allow-Origin");
  }

  return new Response(res.body, { status: res.status, headers });
};
