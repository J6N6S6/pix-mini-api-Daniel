export const onRequestGet = () =>
  Response.json({ ok: true, ts: new Date().toISOString() });
