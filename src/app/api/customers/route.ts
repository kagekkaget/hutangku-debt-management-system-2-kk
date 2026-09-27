import { db } from "@/db";
import { customers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fail, json, str } from "@/lib/api";
import { listCustomers } from "@/lib/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);
  return json({ customers: await listCustomers(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const body = await req.json().catch(() => ({}));
  const name = str(body.name);
  if (!name) return fail("Nama pelanggan wajib diisi.");

  const [row] = await db
    .insert(customers)
    .values({
      userId: user.id,
      name,
      phone: str(body.phone) || null,
      address: str(body.address) || null,
      notes: str(body.notes) || null,
    })
    .returning();

  return json(
    {
      customer: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
        jumlahPiutang: 0,
        sisaPiutang: 0,
        jumlahTransaksi: 0,
        sudahLunas: 0,
      },
    },
    { status: 201 },
  );
}


