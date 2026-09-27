import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, num, str } from "@/lib/api";
import { listDebts } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Partial<typeof debts.$inferInsert> = {};
  if (str(body.description)) patch.description = str(body.description);
  if (num(body.amount) > 0) patch.amount = num(body.amount).toFixed(2);
  if (str(body.dueDate)) patch.dueDate = new Date(str(body.dueDate));
  if (str(body.issueDate)) patch.issueDate = new Date(str(body.issueDate));
  if (num(body.customerId) > 0) patch.customerId = num(body.customerId);
  if (body.status === "belum_lunas" || body.status === "lunas") {
    patch.status = body.status;
  }

  const [row] = await db
    .update(debts)
    .set(patch)
    .where(and(eq(debts.id, Number(id)), eq(debts.userId, user.id)))
    .returning();

  if (!row) return fail("Catatan piutang tidak ditemukan.", 404);
  const all = await listDebts(user.id);
  return json({ debt: all.find((d) => d.id === row.id) ?? null });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  const { id } = await params;

  const [row] = await db
    .delete(debts)
    .where(and(eq(debts.id, Number(id)), eq(debts.userId, user.id)))
    .returning();

  if (!row) return fail("Catatan piutang tidak ditemukan.", 404);
  return json({ ok: true });
}
