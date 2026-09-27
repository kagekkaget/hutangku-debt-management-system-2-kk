import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, num } from "@/lib/api";
import { listDebts } from "@/lib/queries";
import { reminderMessage, sendWhatsApp, waLink } from "@/lib/wa";
import { tanggal } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const rows = (await listDebts(user.id)).filter((d) => d.sisa > 0.5);
  const items = rows
    .sort((a, b) => a.terlambat - b.terlambat || b.sisa - a.sisa)
    .map((d) => {
      const message = reminderMessage({
        warungName: user.warungName,
        customerName: d.customerName,
        sisa: d.sisa,
        jatuhTempo: tanggal(d.dueDate),
        keterangan: d.description,
      });
      return {
        id: d.id,
        customerName: d.customerName,
        phone: d.customerPhone,
        description: d.description,
        sisa: d.sisa,
        dueDate: d.dueDate,
        terlambat: d.terlambat,
        remindedAt: d.remindedAt,
        message,
        link: waLink(d.customerPhone, message),
      };
    });

  return json({ reminders: items });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const body = await req.json().catch(() => ({}));
  const debtId = num(body.debtId);
  if (!debtId) return fail("Catatan piutang tidak valid.");

  const rows = await listDebts(user.id);
  const target = rows.find((d) => d.id === debtId);
  if (!target) return fail("Catatan piutang tidak ditemukan.", 404);

  const message = reminderMessage({
    warungName: user.warungName,
    customerName: target.customerName,
    sisa: target.sisa,
    jatuhTempo: tanggal(target.dueDate),
    keterangan: target.description,
  });

  const result = await sendWhatsApp(target.customerPhone, message);

  await db
    .update(debts)
    .set({ remindedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, user.id)));

  return json({
    result,
    link: waLink(target.customerPhone, message),
    message,
    remindedAt: new Date().toISOString(),
    debtId,
  });
}


