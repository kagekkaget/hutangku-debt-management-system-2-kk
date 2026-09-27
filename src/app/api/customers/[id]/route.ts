import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, str } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [row] = await db
    .update(customers)
    .set({
      name: str(body.name) || undefined,
      phone: str(body.phone) ?? null,
      address: str(body.address) ?? null,
      notes: str(body.notes) ?? null,
    })
    .where(and(eq(customers.id, Number(id)), eq(customers.userId, user.id)))
    .returning();

  if (!row) return fail("Pelanggan tidak ditemukan.", 404);
  return json({ customer: row });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  const { id } = await params;

  const [row] = await db
    .delete(customers)
    .where(and(eq(customers.id, Number(id)), eq(customers.userId, user.id)))
    .returning();

  if (!row) return fail("Pelanggan tidak ditemukan.", 404);
  return json({ ok: true });
}
