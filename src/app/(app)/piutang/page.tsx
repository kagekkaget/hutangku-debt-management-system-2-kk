"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { NotebookPen, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  Btn,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  SkeletonRows,
  StatusPill,
  useNotice,
} from "@/components/ui";
import type { CustomerRow, DebtRow } from "@/lib/types";
import { METODE_LABEL, rupiah, tanggal } from "@/lib/format";

const FILTERS = [
  { key: "berjalan", label: "Berjalan" },
  { key: "belum_lunas", label: "Belum lunas" },
  { key: "sebagian", label: "Sebagian" },
  { key: "lunas", label: "Lunas" },
  { key: "semua", label: "Semua" },
] as const;

const emptyForm = {
  customerId: "",
  description: "",
  amount: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
};

export default function PiutangPage() {
  const [debts, setDebts] = useState<DebtRow[] | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [filter, setFilter] = useState<string>("berjalan");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DebtRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payFor, setPayFor] = useState<DebtRow | null>(null);
  const [pay, setPay] = useState({
    amount: "",
    method: "tunai",
    note: "",
    paidAt: new Date().toISOString().slice(0, 10),
  });
  const [paying, setPaying] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DebtRow | null>(null);
  const { notify, node } = useNotice();

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([
      fetch("/api/debts", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/customers", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setDebts(d.debts ?? []);
    setCustomers(c.customers ?? []);
  }, []);

  useEffect(() => {
    load();
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("baru")
    ) {
      setForm(emptyForm);
      setEditing(null);
      setFormOpen(true);
    }
  }, [load]);

  const rows = useMemo(() => {
    const list = debts ?? [];
    if (filter === "semua") return list;
    if (filter === "berjalan") return list.filter((d) => d.sisa > 0.5);
    return list.filter((d) => d.status === filter);
  }, [debts, filter]);

  const totalSisa = rows.reduce((a, b) => a + b.sisa, 0);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
    });
    setFormOpen(true);
  }

  function openEdit(d: DebtRow) {
    setEditing(d);
    setForm({
      customerId: String(d.customerId),
      description: d.description,
      amount: String(d.amount),
      issueDate: d.issueDate.slice(0, 10),
      dueDate: d.dueDate.slice(0, 10),
    });
    setFormOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing && !form.customerId) {
      notify("Pilih pelanggan terlebih dahulu", "bad");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/debts/${editing.id}` : "/api/debts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Gagal menyimpan catatan piutang", "bad");
        return;
      }
      notify(editing ? "Catatan piutang diperbarui" : "Piutang baru tercatat");
      setFormOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (!payFor) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pay, debtId: payFor.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Gagal mencatat pembayaran", "bad");
        return;
      }
      // optimistic: perbarui baris tanpa menunggu reload penuh
      setDebts((prev) =>
        (prev ?? []).map((d) => (d.id === payFor.id ? data.debt : d)),
      );
      notify(`Pembayaran ${rupiah(Number(pay.amount))} tercatat`);
      setPayFor(null);
      setPay({
        amount: "",
        method: "tunai",
        note: "",
        paidAt: new Date().toISOString().slice(0, 10),
      });
      load();
    } finally {
      setPaying(false);
    }
  }

  async function remove(id: number) {
    const prev = debts ?? [];
    setPendingDelete(null);
    setDebts((ds) => (ds ?? []).filter((d) => d.id !== id));
    const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setDebts(prev);
      notify("Gagal menghapus catatan", "bad");
      return;
    }
    notify("Catatan piutang dihapus");
    load();
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="smallcaps text-abu">Buku piutang</p>
          <h2 className="display mt-2 text-[1.9rem] leading-tight font-bold tracking-[-0.02em]">
            {debts ? `${debts.length} catatan hutang` : "Memuat…"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-abu">
            Catat setiap hutang pelangan, pantau jatuh tempo, dan terima
            pembayaran sebagian sampai lunas.
          </p>
        </div>
        <Btn onClick={openCreate}>
          <Plus size={15} /> Catat piutang
        </Btn>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors ${
              filter === f.key
                ? "border-daun bg-daun text-kertas"
                : "border-garis-2 text-abu hover:border-daun/40 hover:text-tinta"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="num ml-auto text-[0.82rem] text-abu">
          Total sisa: <strong className="text-tinta">{rupiah(totalSisa)}</strong>
        </span>
      </div>

      <section className="mt-5 overflow-hidden rounded-[4px] border border-garis bg-kartu">
        {!debts ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<NotebookPen size={26} strokeWidth={1.6} />}
            title="Belum ada catatan di sini"
            description="Catat piutang baru setiap pelanggan berhutang, lengkap dengan tanggal jatuh temponya."
            action={
              <Btn onClick={openCreate}>
                <Plus size={15} /> Catat piutang
              </Btn>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left">
              <thead>
                <tr className="border-b border-garis">
                  {[
                    "Pelanggan",
                    "Keterangan",
                    "Jatuh tempo",
                    "Nominal",
                    "Dibayar",
                    "Sisa",
                    "Status",
                    "",
                  ].map((h, i) => (
                    <th
                      key={h + i}
                      className={`smallcaps px-5 py-3 text-abu ${
                        i >= 3 && i <= 5 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {rows.map((d) => (
                  <tr
                    key={d.id}
                    className="group transition-colors hover:bg-kertas-2/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-daun-muda text-[0.68rem] font-bold text-daun">
                          {d.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[0.875rem] font-semibold">
                            {d.customerName}
                          </div>
                          <div className="num text-[0.72rem] text-abu">
                            {d.customerPhone ?? "tanpa nomor"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[18rem] truncate text-[0.83rem]">
                        {d.description}
                      </div>
                      <div className="text-[0.7rem] text-abu">
                        dicatat {tanggal(d.issueDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[0.82rem] font-medium">
                        {tanggal(d.dueDate)}
                      </div>
                      <div
                        className={`text-[0.72rem] ${
                          d.terlambat > 0 ? "text-merah" : "text-abu"
                        }`}
                      >
                        {d.terlambat > 0
                          ? `terlambat ${d.terlambat} hari`
                          : d.terlambat === 0
                            ? "jatuh tempo hari ini"
                            : `${Math.abs(d.terlambat)} hari lagi`}
                      </div>
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.85rem] text-abu">
                      {rupiah(d.amount)}
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.85rem] text-daun">
                      {rupiah(d.paid)}
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.92rem] font-semibold">
                      {rupiah(d.sisa)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={d.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setPayFor(d);
                            setPay({
                              amount: String(Math.round(d.sisa)),
                              method: "tunai",
                              note: "",
                              paidAt: new Date().toISOString().slice(0, 10),
                            });
                          }}
                          disabled={d.sisa <= 0.5}
                          className="inline-flex items-center gap-1.5 rounded-[3px] border border-garis-2 px-2.5 py-1.5 text-[0.72rem] font-semibold text-daun transition-colors hover:border-daun hover:bg-daun-muda disabled:opacity-40"
                        >
                          <Wallet size={13} /> Terima bayar
                        </button>
                        <button
                          onClick={() => openEdit(d)}
                          aria-label="Ubah"
                          className="rounded-[3px] p-2 text-abu hover:bg-kertas-2 hover:text-tinta"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(d)}
                          aria-label="Hapus"
                          className="rounded-[3px] p-2 text-abu hover:bg-merah-muda hover:text-merah"
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

      {/* form piutang */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah catatan piutang" : "Catat piutang baru"}
        subtitle="Nominal dan tanggal jatuh tempo dipakai untuk laporan aging."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Pelanggan">
            <Select
              value={form.customerId}
              onChange={(e) =>
                setForm({ ...form, customerId: e.target.value })
              }
              disabled={!!editing}
              required
            >
              <option value="">— pilih pelanggan —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Keterangan hutang">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="mis. Beras 5kg + minyak goreng 2L"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nominal (Rp)">
              <Input
                type="number"
                min={0}
                step="1000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="150000"
                required
              />
            </Field>
            <Field label="Tanggal catat">
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm({ ...form, issueDate: e.target.value })
                }
              />
            </Field>
            <Field label="Jatuh tempo">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" type="button" onClick={() => setFormOpen(false)}>
              Batal
            </Btn>
            <Btn type="submit" loading={saving}>
              {editing ? "Simpan perubahan" : "Simpan piutang"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* pembayaran */}
      <Modal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title="Terima pembayaran"
        subtitle={
          payFor
            ? `${payFor.customerName} · sisa tagihan ${rupiah(payFor.sisa)}`
            : undefined
        }
      >
        <form onSubmit={submitPayment} className="space-y-4">
          <Field label="Nominal diterima (Rp)">
            <Input
              type="number"
              min={1}
              step="1000"
              value={pay.amount}
              onChange={(e) => setPay({ ...pay, amount: e.target.value })}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Metode">
              <Select
                value={pay.method}
                onChange={(e) => setPay({ ...pay, method: e.target.value })}
              >
                {Object.entries(METODE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal bayar">
              <Input
                type="date"
                value={pay.paidAt}
                onChange={(e) => setPay({ ...pay, paidAt: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Catatan (opsional)">
            <Input
              value={pay.note}
              onChange={(e) => setPay({ ...pay, note: e.target.value })}
              placeholder="mis. bayar sebagian, sisanya minggu depan"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" type="button" onClick={() => setPayFor(null)}>
              Batal
            </Btn>
            <Btn type="submit" loading={paying}>
              Catat pembayaran
            </Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Hapus catatan piutang?"
        width="max-w-md"
      >
        <p className="text-sm leading-relaxed text-abu">
          Catatan{" "}
          <strong className="text-tinta">{pendingDelete?.description}</strong>{" "}
          milik {pendingDelete?.customerName} beserta riwayat pembayarannya akan
          dihapus permanen.
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
