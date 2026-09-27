import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json } from "@/lib/api";
import { listDebts, recalcDebtStatus } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  const { id } = await params;

  const [row] = await db
    .delete(payments)
    .where(and(eq(payments.id, Number(id)), eq(payments.userId, user.id)))
    .returning();

  if (!row) return fail("Pembayaran tidak ditemukan.", 404);

  await recalcDebtStatus(row.debtId);
  const all = await listDebts(user.id);
  return json({ ok: true, debt: all.find((d) => d.id === row.debtId) ?? null });
}
