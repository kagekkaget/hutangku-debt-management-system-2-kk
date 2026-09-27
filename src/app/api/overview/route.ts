import { getSessionUser } from "@/lib/auth";
import { fail, json } from "@/lib/api";
import { listCustomers, listDebts, listPayments, summary } from "@/lib/queries";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir, silakan masuk kembali.", 401);

  const [debtsAll, customersAll, paymentsAll, totals] = await Promise.all([
    listDebts(user.id),
    listCustomers(user.id),
    listPayments(user.id),
    summary(user.id),
  ]);

  return json({
    user: {
      id: user.id,
      name: user.name,
      warungName: user.warungName,
      email: user.email,
      phone: user.phone,
    },
    summary: totals,
    debts: debtsAll,
    customers: customersAll,
    payments: paymentsAll.slice(0, 8),
  });
}
