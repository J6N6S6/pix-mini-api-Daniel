// _middleware.js  (Cloudflare Pages Functions)
// CORS baseado em variável de ambiente CORS_ORIGIN
// Aceita: "*"  ou lista separada por vírgulas/espaços (sem barra final).
// Ex.: CORS_ORIGIN="https://maisdigital.space https://checkout-will.vercel.app http://localhost:3000"

const corsEnv = (typeof process !== "undefined" && process.env.CORS_ORIGIN) || "";
console.log("[CORS] rawOrigins =>", corsEnv);

const allowAll = corsEnv.trim() === "*";

function normalize(s = "") {
  return String(s).trim().replace(/\/+$/, ""); // remove barra(s) final(is)
}

const allowedOrigins = new Set(
  allowAll
    ? []
    : corsEnv
        .split(/[, ]+/)               // vírgula OU espaço
        .map(normalize)
        .filter(Boolean)
);

function getAllowedOrigin(request) {
  const origin = normalize(request.headers.get("Origin"));
  if (!origin) return "";
  if (allowAll) return origin;        // curinga: reflete a origem solicitante
  if (allowedOrigins.has(origin)) return origin;
  return "";                          // bloqueia se não listado
}

const baseCorsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,Idempotency-Key,x-api-token",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin, accept-encoding"
};

// OPTIONS (preflight)
export const onRequestOptions = async ({ request }) => {
  const allowOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      ...baseCorsHeaders,
      ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {})
    }
  });
};

// Aplica CORS a todas as respostas
export const onRequest = async ({ request, next }) => {
  const res = await next();
  const allowOrigin = getAllowedOrigin(request);

  const h = new Headers(res.headers);
  if (allowOrigin) h.set("Access-Control-Allow-Origin", allowOrigin);
  // (Opcional) se precisar enviar cookies/credenciais no futuro:
  // h.set("Access-Control-Allow-Credentials", "true");

  // garante Vary consistente
  h.set("Vary", baseCorsHeaders.Vary);

  return new Response(res.body, { status: res.status, headers: h });
};
