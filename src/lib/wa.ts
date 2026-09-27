/**
 * Integrasi WA Gateway.
 *
 * Konfigurasi lewat environment variable (server-side saja):
 *   WA_GATEWAY_URL   — base URL gateway, mis. https://wa.example-gateway.id
 *   WA_GATEWAY_TOKEN — token / API key Bearer
 *
 * Bila belum dikonfigurasi, pengiriman disimulasikan agar alur tetap jalan
 * dan pengguna tetap dapat tautan wa.me untuk mengirim manual.
 */

export type WaSendResult = {
  ok: boolean;
  simulated: boolean;
  channel: "gateway" | "manual";
  message: string;
};

const clean = (raw: string) => raw.replace(/[^0-9]/g, "").replace(/^0/, "62");

export function waLink(phone: string | null | undefined, message: string): string {
  const target = clean(phone ?? "");
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function reminderMessage(input: {
  warungName: string;
  customerName: string;
  sisa: number;
  jatuhTempo: string;
  keterangan: string;
}): string {
  const rupiah = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(input.sisa));
  return [
    `Halo ${input.customerName}, kami dari ${input.warungName}.`,
    ``,
    `Catatan pembelian Anda: *${input.keterangan}*`,
    `Sisa tagihan: *Rp ${rupiah}*`,
    `Jatuh tempo: ${input.jatuhTempo}`,
    ``,
    `Mohon pembayarannya saat berkunjung berikutnya. Terima kasih 🙏`,
  ].join("\n");
}

export async function sendWhatsApp(
  phone: string | null | undefined,
  message: string,
): Promise<WaSendResult> {
  const base = process.env.WA_GATEWAY_URL;
  const token = process.env.WA_GATEWAY_TOKEN;
  const target = clean(phone ?? "");

  if (!base || !token) {
    return {
      ok: true,
      simulated: true,
      channel: "manual",
      message: "Gateway WA belum dikonfigurasi — pesan disiapkan untuk dikirim manual.",
    };
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone: target, message }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        ok: false,
        simulated: true,
        channel: "manual",
        message: `Gateway menolak permintaan (HTTP ${res.status}).`,
      };
    }
    return {
      ok: true,
      simulated: false,
      channel: "gateway",
      message: "Pengingat terkirim melalui WA Gateway.",
    };
  } catch {
    return {
      ok: false,
      simulated: true,
      channel: "manual",
      message: "Gateway tidak dapat dihubungi — pesan disiapkan untuk dikirim manual.",
    };
  }
}
