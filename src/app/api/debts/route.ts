import { db } from "@/db";
import { debts } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, num, str } from "@/lib/api";
import { listDebts } from "@/lib/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  return json({ debts: await listDebts(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const body = await req.json().catch(() => ({}));
  const description = str(body.description);
  const amount = num(body.amount);
  const customerId = num(body.customerId);
  const dueDate = str(body.dueDate);

  if (!customerId) return fail("Pelanggan wajib dipilih.");
  if (!description) return fail("Keterangan hutang wajib diisi.");
  if (amount <= 0) return fail("Nominal harus lebih besar dari 0.");
  if (!dueDate) return fail("Tanggal jatuh tempo wajib diisi.");

  const [row] = await db
    .insert(debts)
    .values({
      userId: user.id,
      customerId,
      description,
      amount: amount.toFixed(2),
      issueDate: str(body.issueDate) ? new Date(str(body.issueDate)) : new Date(),
      dueDate: new Date(dueDate),
    })
    .returning();

  const all = await listDebts(user.id);
  return json(
    { debt: all.find((d) => d.id === row.id) ?? null },
    { status: 201 },
  );
}
