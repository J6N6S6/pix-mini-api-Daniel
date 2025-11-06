const nowUtcStr = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}`;

export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await request.json();
    const required = body?.amount && body?.customer?.name && body?.customer?.email && body?.customer?.phone && body?.customer?.document;
    if (!required) {
      return Response.json({ error: "Campos obrigatórios: amount, customer.{name,email,phone,document}" }, { status: 400 });
    }

    const auth = btoa(`${env.GHOSTS_SECRET_KEY}:${env.GHOSTS_COMPANY_ID}`);

    const payload = {
      paymentMethod: "PIX",
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: String(body.customer.phone)
      },
      document: { number: String(body.customer.document).replace(/\D/g, ""), type: "CPF" },
      pix: { expiresInDays: Number(body?.pix?.expiresInDays || 1) },
      items: [{
        title: body?.item?.title || "Produto",
        unitPrice: Number(body?.item?.unitPrice || body.amount),
        quantity: Number(body?.item?.quantity || 1),
        externalRef: body?.metadata?.sku || undefined
      }],
      amount: Number(body.amount),
      description: body?.description || "CheckoutWill",
      metadata: body?.metadata || undefined
    };

    const r = await fetch(`${env.GHOSTS_BASE}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Response.json({ error: "Falha ao criar PIX", detail: `HTTP ${r.status}`, raw: data }, { status: r.status });
    }

    const emv = data?.pix?.qrcodeText || data?.pix?.qrcode || null;

    return Response.json({
      id: data.id,
      status: data.status,
      qrcodeUrl: data?.pix?.qrcodeUrl || data?.pix?.receiptUrl || null,
      emv,
      expirationDate: data?.pix?.expirationDate || null,
      raw: data
    });
  } catch (e) {
    return Response.json({ error: "Erro no /pix", detail: String(e) }, { status: 500 });
  }
};
