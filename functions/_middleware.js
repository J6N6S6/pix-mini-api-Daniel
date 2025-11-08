// _middleware.js — Cloudflare Pages Functions
// Lê CORS_ORIGIN do "env" (Pages Functions), não de process.env!
// CORS_ORIGIN pode ser "*" OU uma lista separada por vírgulas/espaços.
// Ex.: CORS_ORIGIN="https://maisdigital.space https://checkout-will.vercel.app http://localhost:3000"

let _corsCache = null; // cache em memória entre requests

function buildCorsConfigFromEnv(env) {
  const raw = (env && env.CORS_ORIGIN) ? String(env.CORS_ORIGIN) : "";
  const allowAll = raw.trim() === "*";

  const normalize = (s = "") => String(s).trim().replace(/\/+$/, "");

  const allowed = allowAll
    ? new Set()
    : new Set(
        raw
          .split(/[, ]+/)        // vírgula OU espaço
          .map(normalize)
          .filter(Boolean)
      );

  return { allowAll, allowed, normalize, raw };
}

function getAllowedOrigin(request, env) {
  // (re)monta configuração se ainda não existe ou se mudou o valor
  if (!_corsCache || (_corsCache.raw || "") !== (env?.CORS_ORIGIN || "")) {
    _corsCache = buildCorsConfigFromEnv(env);
    console.log("[CORS] rawOrigins =>", _corsCache.raw || "(vazio)");
  }

  const { allowAll, allowed, normalize } = _corsCache;

  const origin = normalize(request.headers.get("Origin"));
  if (!origin) return "";               // sem origem -> não seta header

  if (allowAll) return origin;          // modo curinga: reflete a origem solicitante
  if (allowed.has(origin)) return origin;

  return "";                            // bloqueia se não listado
}

const baseCorsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,Idempotency-Key,x-api-token",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin, accept-encoding"
};

// OPTIONS (preflight)
export const onRequestOptions = async ({ request, env }) => {
  const allowOrigin = getAllowedOrigin(request, env);
  return new Response(null, {
    status: 204,
    headers: {
      ...baseCorsHeaders,
      ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {})
    }
  });
};

// Aplica CORS a todas as respostas
export const onRequest = async ({ request, env, next }) => {
  const res = await next();
  const allowOrigin = getAllowedOrigin(request, env);

  const h = new Headers(res.headers);
  if (allowOrigin) h.set("Access-Control-Allow-Origin", allowOrigin);
  h.set("Vary", baseCorsHeaders.Vary);

  return new Response(res.body, { status: res.status, headers: h });
};
