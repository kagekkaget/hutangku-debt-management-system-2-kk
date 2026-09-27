import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, debts, payments, type Debt } from "@/db/schema";
import { num } from "@/lib/api";
import { bucketOf, type AgingBucket } from "@/lib/format";

export type DebtRow = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  description: string;
  amount: number;
  paid: number;
  sisa: number;
  issueDate: string;
  dueDate: string;
  status: Debt["status"];
  remindedAt: string | null;
  bucket: AgingBucket;
  terlambat: number;
};

export type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  jumlahPiutang: number;
  sisaPiutang: number;
  jumlahTransaksi: number;
  sudahLunas: number;
};

export type PaymentRow = {
  id: number;
  debtId: number;
  amount: number;
  method: string;
  note: string | null;
  paidAt: string;
  customerName: string;
  description: string;
};

const iso = (d: Date | string) => new Date(d).toISOString();

export async function listDebts(userId: number): Promise<DebtRow[]> {
  const rows = await db
    .select({
      debt: debts,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(debts)
    .innerJoin(customers, eq(debts.customerId, customers.id))
    .where(eq(debts.userId, userId))
    .orderBy(desc(debts.dueDate));

  const ids = rows.map((r) => r.debt.id);
  const paidMap = new Map<number, number>();
  if (ids.length) {
    const sums = await db
      .select({
        debtId: payments.debtId,
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(inArray(payments.debtId, ids))
      .groupBy(payments.debtId);
    for (const s of sums) paidMap.set(s.debtId, num(s.total));
  }

  return rows.map(({ debt, customerName, customerPhone }) => {
    const paid = paidMap.get(debt.id) ?? 0;
    const amount = num(debt.amount);
    const sisa = Math.max(0, amount - paid);
    const terlambat = Math.round(
      (Date.now() - new Date(debt.dueDate).getTime()) / 86_400_000,
    );
    return {
      id: debt.id,
      customerId: debt.customerId,
      customerName,
      customerPhone,
      description: debt.description,
      amount,
      paid,
      sisa,
      issueDate: iso(debt.issueDate),
      dueDate: iso(debt.dueDate),
      status: debt.status,
      remindedAt: debt.remindedAt ? iso(debt.remindedAt) : null,
      bucket: bucketOf(debt.dueDate),
      terlambat,
    };
  });
}

export async function listCustomers(userId: number): Promise<CustomerRow[]> {
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .orderBy(desc(customers.createdAt));

  const sums = await db
    .select({
      customerId: debts.customerId,
      total: sql<string>`coalesce(sum(${debts.amount}), 0)`,
      jumlah: sql<string>`count(*)`,
    })
    .from(debts)
    .where(eq(debts.userId, userId))
    .groupBy(debts.customerId);

  const paidSums = await db
    .select({
      customerId: debts.customerId,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(debts, eq(payments.debtId, debts.id))
    .where(eq(payments.userId, userId))
    .groupBy(debts.customerId);

  const sumMap = new Map(sums.map((s) => [s.customerId, s]));
  const paidMap = new Map(paidSums.map((s) => [s.customerId, num(s.total)]));

  return rows.map((c) => {
    const total = num(sumMap.get(c.id)?.total);
    const paid = paidMap.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      createdAt: iso(c.createdAt),
      jumlahPiutang: total,
      sisaPiutang: Math.max(0, total - paid),
      jumlahTransaksi: Number(sumMap.get(c.id)?.jumlah ?? 0),
      sudahLunas: paid,
    };
  });
}

export async function listPayments(userId: number): Promise<PaymentRow[]> {
  const rows = await db
    .select({
      payment: payments,
      customerName: customers.name,
      description: debts.description,
    })
    .from(payments)
    .innerJoin(debts, eq(payments.debtId, debts.id))
    .innerJoin(customers, eq(debts.customerId, customers.id))
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.paidAt))
    .limit(200);

  return rows.map(({ payment, customerName, description }) => ({
    id: payment.id,
    debtId: payment.debtId,
    amount: num(payment.amount),
    method: payment.method,
    note: payment.note,
    paidAt: iso(payment.paidAt),
    customerName,
    description,
  }));
}

export async function recalcDebtStatus(debtId: number) {
  const [row] = await db
    .select({
      amount: debts.amount,
      paid: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(debts)
    .leftJoin(payments, eq(payments.debtId, debts.id))
    .where(eq(debts.id, debtId))
    .groupBy(debts.id);
  if (!row) return;
  const amount = num(row.amount);
  const paid = num(row.paid);
  const status =
    paid <= 0 ? "belum_lunas" : paid >= amount ? "lunas" : "sebagian";
  await db
    .update(debts)
    .set({ status })
    .where(and(eq(debts.id, debtId)));
}

export async function summary(userId: number) {
  const rows = await listDebts(userId);
  const berjalan = rows.filter((r) => r.sisa > 0.5);
  const totalPiutang = berjalan.reduce((a, b) => a + b.sisa, 0);

  const buckets: Record<AgingBucket, number> = {
    belum_jatuh_tempo: 0,
    "1-7": 0,
    "8-30": 0,
    "31-60": 0,
    ">60": 0,
  };
  for (const r of berjalan) buckets[r.bucket] += r.sisa;

  const now = new Date();
  const mulaiBulan = new Date(now.getFullYear(), now.getMonth(), 1);
  const awalBulanDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const bulanIni = await db
    .select({
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        sql`${payments.paidAt} >= ${mulaiBulan.toISOString()}`,
        sql`${payments.paidAt} < ${awalBulanDepan.toISOString()}`,
      ),
    );

  const lunasCount = rows.filter((r) => r.status === "lunas").length;

  return {
    totalPiutang,
    jumlahPelangganPiutang: new Set(berjalan.map((r) => r.customerId)).size,
    jumlahTagihan: berjalan.length,
    terlambat: berjalan
      .filter((r) => r.bucket !== "belum_jatuh_tempo")
      .reduce((a, b) => a + b.sisa, 0),
    jatuhTempoMingguIni: berjalan
      .filter((r) => {
        const d = Math.round(
          (new Date(r.dueDate).getTime() - Date.now()) / 86_400_000,
        );
        return d >= 0 && d <= 7;
      })
      .reduce((a, b) => a + b.sisa, 0),
    terkumpulBulanIni: num(bulanIni[0]?.total),
    lunasCount,
    buckets,
  };
}
