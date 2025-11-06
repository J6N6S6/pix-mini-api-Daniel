const nowUtcStr = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}`;

export const onRequestPost = async ({ request, env }) => {
  try {
    const input = await request.json();
    const { utmify, event, base } = input || {};

    let payload;
    if (utmify && typeof utmify === "object") {
      payload = utmify;
    } else {
      if (!event || !base?.orderId || !base?.platform || !base?.customer || !base?.products) {
        return Response.json({ error: "Informe event, base.orderId, base.platform, base.customer, base.products" }, { status: 400 });
      }
      const status = event === "pix_paid" ? "paid" : "waiting_payment";
      const createdAt = base.createdAtUtc || nowUtcStr(); // UTC
      const approvedDate = status === "paid" ? (base.approvedAtUtc || nowUtcStr()) : null;

      payload = {
        orderId: base.orderId,
        platform: base.platform,
        paymentMethod: "pix",
        status,
        createdAt,
        approvedDate,
        refundedAt: null,
        customer: {
          name: base.customer.name,
          email: base.customer.email,
          phone: base.customer.phone ?? null,
          document: base.customer.document ?? null,
          country: base.customer.country ?? "BR",
          ip: base.customer.ip ?? "127.0.0.1"
        },
        products: base.products.map(p => ({
          id: p.id,
          name: p.name,
          planId: p.planId ?? null,
          planName: p.planName ?? null,
          quantity: Number(p.quantity || 1),
          priceInCents: Number(p.priceInCents)
        })),
        trackingParameters: {
          src: base?.trackingParameters?.src ?? null,
          sck: base?.trackingParameters?.sck ?? null,
          utm_source: base?.trackingParameters?.utm_source ?? null,
          utm_campaign: base?.trackingParameters?.utm_campaign ?? null,
          utm_medium: base?.trackingParameters?.utm_medium ?? null,
          utm_content: base?.trackingParameters?.utm_content ?? null,
          utm_term: base?.trackingParameters?.utm_term ?? null
        },
        commission: {
          totalPriceInCents: Number(base?.commission?.totalPriceInCents ?? 0),
          gatewayFeeInCents: Number(base?.commission?.gatewayFeeInCents ?? 0),
          userCommissionInCents: Number(base?.commission?.userCommissionInCents ?? 0),
          currency: base?.commission?.currency ?? "BRL"
        },
        isTest: !!base?.isTest
      };
    }

    const r = await fetch(env.UTMIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": env.UTMIFY_TOKEN },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Response.json({ error: "Falha ao notificar UTMify", detail: `HTTP ${r.status}`, raw: data }, { status: r.status });
    }
    return Response.json({ ok: true, utmifyResponse: data });
  } catch (e) {
    return Response.json({ error: "Erro no /notify", detail: String(e) }, { status: 500 });
  }
};
