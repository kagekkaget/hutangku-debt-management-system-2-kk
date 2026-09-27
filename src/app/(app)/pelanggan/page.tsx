"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  NotebookPen,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  Btn,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  SkeletonRows,
  StatusPill,
  Textarea,
  useNotice,
} from "@/components/ui";
import type { CustomerRow, DebtRow } from "@/lib/types";
import { rupiah, tanggal } from "@/lib/format";

const kosong = { name: "", phone: "", address: "", notes: "" };

export default function PelangganPage() {
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [detail, setDetail] = useState<CustomerRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(kosong);
  const { notify, node } = useNotice();

  const load = useCallback(async () => {
    const [c, d] = await Promise.all([
      fetch("/api/customers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/debts", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setCustomers(c.customers ?? []);
    setDebts(d.debts ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = customers ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.phone ?? "").includes(needle) ||
        (c.address ?? "").toLowerCase().includes(needle),
    );
  }, [customers, q]);

  const detailDebts = useMemo(
    () => (detail ? debts.filter((d) => d.customerId === detail.id) : []),
    [debts, detail],
  );

  function openCreate() {
    setEditing(null);
    setValues(kosong);
    setFormOpen(true);
  }

  function openEdit(c: CustomerRow) {
    setEditing(c);
    setValues({
      name: c.name,
      phone: c.phone ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setFormOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = JSON.stringify(values);
    try {
      const res = await fetch(
        editing ? `/api/customers/${editing.id}` : "/api/customers",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        },
      );
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Gagal menyimpan pelanggan", "bad");
        return;
      }
      notify(editing ? "Perubahan pelanggan tersimpan" : "Pelanggan baru ditambahkan");
      setFormOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const prev = customers ?? [];
    setPendingDelete(null);
    setCustomers((cs) => (cs ?? []).filter((c) => c.id !== id));
    if (detail?.id === id) setDetail(null);
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setCustomers(prev);
      notify("Gagal menghapus pelanggan", "bad");
      return;
    }
    notify("Pelanggan dihapus beserta catatan piutangnya");
    load();
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="smallcaps text-abu">Buku pelanggan</p>
          <h2 className="display mt-2 text-[1.9rem] leading-tight font-bold tracking-[-0.02em]">
            {customers ? `${customers.length} pelanggan tercatat` : "Memuat…"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-abu">
            Simpan kontak pelanggan yang pernah berhutang, lengkap dengan riwayat
            piutang dan pembayarannya.
          </p>
        </div>
        <Btn onClick={openCreate}>
          <Plus size={15} /> Tambah pelanggan
        </Btn>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-abu-2"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, nomor HP, atau alamat…"
          className="pl-9"
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-[4px] border border-garis bg-kartu">
        {!customers ? (
          <SkeletonRows rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserRound size={26} strokeWidth={1.6} />}
            title={q ? "Tidak ada yang cocok" : "Belum ada pelanggan"}
            description={
              q
                ? "Coba kata kunci lain, atau tambahkan pelanggan baru."
                : "Tambahkan pelanggan yang pernah berhutang agar piutangnya mudah ditagih."
            }
            action={
              <Btn onClick={openCreate}>
                <Plus size={15} /> Tambah pelanggan
              </Btn>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left">
              <thead>
                <tr className="border-b border-garis">
                  {[
                    "Pelanggan",
                    "Kontak",
                    "Transaksi",
                    "Total piutang",
                    "Sisa tagihan",
                    "",
                  ].map((h, i) => (
                    <th
                      key={h + i}
                      className={`smallcaps px-5 py-3 text-abu ${
                        i >= 2 && i <= 4 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="group cursor-pointer transition-colors hover:bg-kertas-2/50"
                    onClick={() => setDetail(c)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-daun-muda text-[0.72rem] font-bold text-daun">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[0.9rem] font-semibold">
                            {c.name}
                          </div>
                          <div className="max-w-[16rem] truncate text-[0.72rem] text-abu">
                            {c.address ?? "Alamat belum diisi"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="num text-[0.82rem]">
                        {c.phone ?? "—"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-abu">
                        <Phone size={11} /> {c.phone ? "WhatsApp aktif" : "tanpa nomor"}
                      </div>
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.85rem]">
                      {c.jumlahTransaksi}×
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.85rem] text-abu">
                      {rupiah(c.jumlahPiutang)}
                    </td>
                    <td className="num px-5 py-4 text-right text-[0.92rem] font-semibold">
                      {c.sisaPiutang > 0 ? (
                        rupiah(c.sisaPiutang)
                      ) : (
                        <span className="text-daun">Lunas</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEdit(c)}
                          aria-label={`Ubah ${c.name}`}
                          className="rounded-[3px] p-2 text-abu hover:bg-kertas-2 hover:text-tinta"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(c)}
                          aria-label={`Hapus ${c.name}`}
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

      {/* form tambah/ubah */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah data pelanggan" : "Tambah pelanggan"}
        subtitle={
          editing
            ? "Perbarui kontak agar pengingat WhatsApp sampai ke yang benar."
            : "Isi data pelanggan yang sering berhutang di warung Anda."
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama pelanggan">
            <Input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="mis. Pak Dedi Susanto"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor WhatsApp" hint="Awali 08… untuk pengingat otomatis">
              <Input
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
                placeholder="081234567890"
              />
            </Field>
            <Field label="Alamat">
              <Input
                value={values.address}
                onChange={(e) =>
                  setValues({ ...values, address: e.target.value })
                }
                placeholder="Jl. Melati No. 12"
              />
            </Field>
          </div>
          <Field label="Catatan">
            <Textarea
              rows={3}
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
              placeholder="mis. bayar tiap tanggal muda, sering beli beras 5kg"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" type="button" onClick={() => setFormOpen(false)}>
              Batal
            </Btn>
            <Btn type="submit" loading={saving}>
              {editing ? "Simpan perubahan" : "Simpan pelanggan"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* konfirmasi hapus */}
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Hapus pelanggan?"
        width="max-w-md"
      >
        <p className="text-sm leading-relaxed text-abu">
          Data <strong className="text-tinta">{pendingDelete?.name}</strong> beserta
          seluruh catatan piutang dan pembayarannya akan ikut terhapus. Tindakan
          ini tidak bisa dibatalkan.
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

      {/* drawer detail */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
      >
        {detail && (
          <div>
            <div className="border-b border-garis px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="smallcaps text-abu">Sisa tagihan</p>
                  <p className="num mt-1.5 text-[1.35rem] font-semibold text-daun">
                    {rupiah(detail.sisaPiutang)}
                  </p>
                </div>
                <div>
                  <p className="smallcaps text-abu">Total piutang</p>
                  <p className="num mt-1.5 text-[1.35rem] font-semibold">
                    {rupiah(detail.jumlahPiutang)}
                  </p>
                </div>
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-abu">Nomor WhatsApp</dt>
                  <dd className="num">{detail.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-abu">Alamat</dt>
                  <dd className="text-right">{detail.address ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-abu">Terdaftar</dt>
                  <dd>{tanggal(detail.createdAt)}</dd>
                </div>
              </dl>
              {detail.notes ? (
                <p className="mt-4 rounded-[3px] border border-dashed border-garis-2 bg-kertas-2/50 px-3.5 py-3 text-[0.82rem] leading-relaxed text-abu">
                  {detail.notes}
                </p>
              ) : null}
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <h3 className="smallcaps text-abu">Riwayat piutang</h3>
                <span className="num text-[0.72rem] text-abu-2">
                  {detailDebts.length} catatan
                </span>
              </div>

              {detailDebts.length === 0 ? (
                <EmptyState
                  icon={<NotebookPen size={24} strokeWidth={1.6} />}
                  title="Belum ada piutang"
                  description="Catat hutang pertama untuk pelanggan ini dari menu Piutang."
                />
              ) : (
                <ul className="mt-4 space-y-3">
                  {detailDebts.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-[3px] border border-garis bg-kartu px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[0.85rem] font-semibold">
                            {d.description}
                          </div>
                          <div className="mt-0.5 text-[0.72rem] text-abu">
                            Jatuh tempo {tanggal(d.dueDate)}
                          </div>
                        </div>
                        <StatusPill status={d.status} />
                      </div>
                      <div className="mt-3 space-y-1 border-t border-garis pt-3">
                        <div className="flex justify-between text-[0.78rem]">
                          <span className="text-abu">Nominal</span>
                          <span className="num">{rupiah(d.amount)}</span>
                        </div>
                        <div className="flex justify-between text-[0.78rem]">
                          <span className="text-abu">Sudah dibayar</span>
                          <span className="num text-daun">
                            {rupiah(d.paid)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[0.82rem] font-semibold">
                          <span>Sisa</span>
                          <span className="num">{rupiah(d.sisa)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {node}
    </div>
  );
}
