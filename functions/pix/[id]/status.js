export const onRequestGet = async ({ params, env }) => {
  try {
    const id = params.id;
    if (!id) {
      return Response.json({ error: "Informe o id da transação" }, { status: 400 });
    }

    const auth = btoa(`${env.GHOSTS_SECRET_KEY}:${env.GHOSTS_COMPANY_ID}`);
    const r = await fetch(`${env.GHOSTS_BASE}/transactions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return Response.json(
        { error: "Falha ao consultar status", detail: `HTTP ${r.status}`, raw: data },
        { status: r.status }
      );
    }

    const rawStatus = String(data?.status || "").toLowerCase();
    const paid = rawStatus === "paid";

    return Response.json({
      paid,
      rawStatus: data?.status || null,
      qrcodeText: data?.pix?.qrcodeText || data?.pix?.qrcode || null,
      endToEndId: data?.pix?.end2EndId || data?.pix?.endToEndId || null,
      raw: data
    });
  } catch (e) {
    return Response.json({ error: "Erro no status", detail: String(e) }, { status: 500 });
  }
};
