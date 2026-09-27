import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, num, str } from "@/lib/api";
import { listDebts, listPayments, recalcDebtStatus } from "@/lib/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  return json({ payments: await listPayments(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const body = await req.json().catch(() => ({}));
  const debtId = num(body.debtId);
  const amount = num(body.amount);

  if (!debtId) return fail("Catatan piutang tidak valid.");
  if (amount <= 0) return fail("Nominal pembayaran harus lebih besar dari 0.");

  const [row] = await db
    .insert(payments)
    .values({
      userId: user.id,
      debtId,
      amount: amount.toFixed(2),
      method: str(body.method) || "tunai",
      note: str(body.note) || null,
      paidAt: str(body.paidAt) ? new Date(str(body.paidAt)) : new Date(),
    })
    .returning();

  await recalcDebtStatus(debtId);
  const debtsAll = await listDebts(user.id);
  const paymentsAll = await listPayments(user.id);

  return json(
    {
      payment: paymentsAll.find((p) => p.id === row.id) ?? null,
      debt: debtsAll.find((d) => d.id === debtId) ?? null,
    },
    { status: 201 },
  );
}


