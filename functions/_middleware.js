// Middleware global do Cloudflare Pages Functions
// Configura CORS e respostas padrão para OPTIONS (preflight)

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.0.11:3000/"
  // 👉 depois você adiciona aqui:
  // "https://checkout-will.vercel.app",
  // "https://www.seudominio.com"
];

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins.includes(origin)) return origin;
  // fallback: permite apenas o primeiro da lista (localhost)
  return allowedOrigins[0];
}

// 🔹 Trata requisições OPTIONS (CORS preflight)
export const onRequestOptions = async ({ request }) => {
  const allowOrigin = getAllowedOrigin(request);
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,Idempotency-Key,x-api-token",
      "Access-Control-Max-Age": "86400"
    }
  });
};

// 🔹 Aplica CORS em todas as respostas
export const onRequest = async ({ request, env, next }) => {
  const res = await next();
  const allowOrigin = getAllowedOrigin(request);
  const newHeaders = new Headers(res.headers);
  newHeaders.set("Access-Control-Allow-Origin", allowOrigin);
  return new Response(res.body, { headers: newHeaders, status: res.status });
};
