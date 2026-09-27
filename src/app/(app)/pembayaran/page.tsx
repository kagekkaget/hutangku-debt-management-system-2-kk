"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, Wallet } from "lucide-react";
import {
  Btn,
  EmptyState,
  Modal,
  SkeletonRows,
  useNotice,
} from "@/components/ui";
import type { PaymentRow } from "@/lib/types";
import { METODE_LABEL, jam, rupiah, tanggal } from "@/lib/format";

export default function PembayaranPage() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PaymentRow | null>(null);
  const { notify, node } = useNotice();

  const load = useCallback(async () => {
    const res = await fetch("/api/payments", { cache: "no-store" });
    const data = await res.json();
    setPayments(data.payments ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bulanIni = useMemo(() => {
    const now = new Date();
    return (payments ?? []).filter((p) => {
      const d = new Date(p.paidAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [payments]);

  const totalBulan = bulanIni.reduce((a, b) => a + b.amount, 0);
  const totalSemua = (payments ?? []).reduce((a, b) => a + b.amount, 0);

  async function remove(id: number) {
    const prev = payments ?? [];
    setPendingDelete(null);
    setPayments((ps) => (ps ?? []).filter((p) => p.id !== id));
    const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPayments(prev);
      notify("Gagal menghapus pembayaran", "bad");
      return;
    }
    notify("Pembayaran dihapus, sisa tagihan disesuaikan");
    load();
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <div>
        <p className="smallcaps text-abu">Kas masuk</p>
        <h2 className="display mt-2 text-[1.9rem] leading-tight font-bold tracking-[-0.02em]">
          Riwayat pembayaran pelanggan
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-abu">
          Setiap uang yang diterima tercatat di sini, termasuk pembayaran
          sebagian yang mengurangi sisa piutang.
        </p>
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-[4px] border border-garis bg-garis sm:grid-cols-3">
        {[
          { label: "Terkumpul bulan ini", value: totalBulan },
          { label: "Jumlah transaksi bulan ini", value: bulanIni.length, uang: false },
          { label: "Total penerimaan tercatat", value: totalSemua },
        ].map((s) => (
          <div key={s.label} className="bg-kartu px-5 py-5">
            <p className="smallcaps text-abu">{s.label}</p>
            <p className="num mt-2 text-[1.45rem] font-semibold">
              {"uang" in s && s.uang === false
                ? `${s.value}×`
                : rupiah(s.value as number)}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-[4px] border border-garis bg-kartu">
        {!payments ? (
          <SkeletonRows rows={7} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Wallet size={26} strokeWidth={1.6} />}
            title="Belum ada pembayaran"
            description="Catat penerimaan uang dari menu Piutang, atau tambahkan langsung lewat tombol “Terima bayar”."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left">
              <thead>
                <tr className="border-b border-garis">
                  {["Waktu", "Pelanggan", "Keterangan", "Metode", "Nominal", ""].map(
                    (h, i) => (
                      <th
                        key={h + i}
                        className={`smallcaps px-5 py-3 text-abu ${
                          i === 4 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-kertas-2/50"
                  >
                    <td className="px-5 py-4">
                      <div className="text-[0.83rem] font-medium">
                        {tanggal(p.paidAt)}
                      </div>
                      <div className="num text-[0.72rem] text-abu">
                        {jam(p.paidAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[0.875rem] font-semibold">
                      {p.customerName}
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[18rem] truncate text-[0.82rem]">
                        {p.description}
                      </div>
                      {p.note ? (
                        <div className="truncate text-[0.72rem] text-abu">
                          {p.note}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-garis-2 px-2.5 py-0.5 text-[0.72rem] font-semibold text-abu">
                        {METODE_LABEL[p.method] ?? p.method}
                      </span>
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.95rem] font-semibold text-daun">
                      + {rupiah(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setPendingDelete(p)}
                          aria-label="Hapus pembayaran"
                          className="rounded-[3px] p-2 text-abu opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-merah-muda hover:text-merah"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Hapus pembayaran?"
        width="max-w-md"
      >
        <p className="text-sm leading-relaxed text-abu">
          Pembayaran{" "}
          <strong className="text-tinta">
            {pendingDelete ? rupiah(pendingDelete.amount) : ""}
          </strong>{" "}
          dari {pendingDelete?.customerName} akan dihapus dan sisa tagihan piutang
          akan dikembalikan seperti semula.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setPendingDelete(null)}>
            Batal
          </Btn>
          <Btn
            variant="danger"
            onClick={() => pendingDelete && remove(pendingDelete.id)}
          >
            <Trash2 size={15} /> Ya, hapus
          </Btn>
        </div>
      </Modal>

      {node}
    </div>
  );
}
