"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  Btn,
  EmptyState,
  SkeletonRows,
  useNotice,
} from "@/components/ui";
import type { ReminderRow } from "@/lib/types";
import { jam, rupiah, tanggal } from "@/lib/format";

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "terlambat", label: "Terlambat" },
  { key: "pekan", label: "Jatuh tempo 7 hari" },
  { key: "belum", label: "Belum pernah dikirim" },
] as const;

export default function PengingatPage() {
  const [rows, setRows] = useState<ReminderRow[] | null>(null);
  const [filter, setFilter] = useState<string>("semua");
  const [kirimId, setKirimId] = useState<number | null>(null);
  const [terkirim, setTerkirim] = useState<Record<number, string>>({});
  const { notify, node } = useNotice();

  const load = useCallback(async () => {
    const res = await fetch("/api/reminders", { cache: "no-store" });
    const data = await res.json();
    setRows(data.reminders ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (filter === "terlambat") return list.filter((r) => r.terlambat > 0);
    if (filter === "pekan")
      return list.filter((r) => {
        const d = Math.round(
          (new Date(r.dueDate).getTime() - Date.now()) / 86_400_000,
        );
        return d >= 0 && d <= 7;
      });
    if (filter === "belum") return list.filter((r) => !r.remindedAt);
    return list;
  }, [rows, filter]);

  const totalTagih = (rows ?? []).reduce((a, b) => a + b.sisa, 0);
  const terlambat = (rows ?? []).filter((r) => r.terlambat > 0);

  async function kirim(id: number) {
    setKirimId(id);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debtId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Gagal mengirim pengingat", "bad");
        return;
      }
      setTerkirim((prev) => ({
        ...prev,
        [id]: `${data.result.message} ${jam(new Date())}`,
      }));
      notify(data.result.message);
      load();
    } finally {
      setKirimId(null);
    }
  }

  async function salin(pesan: string) {
    try {
      await navigator.clipboard.writeText(pesan);
      notify("Teks pengingat disalin");
    } catch {
      notify("Gagal menyalin teks", "bad");
    }
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="smallcaps text-abu">Pengingat otomatis</p>
          <h2 className="display mt-2 text-[1.9rem] leading-tight font-bold tracking-[-0.02em]">
            Tagih tepat waktu lewat WhatsApp
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-abu">
            Pesan disusun otomatis berisi sisa tagihan dan tanggal jatuh tempo.
            Kirim melalui WA Gateway bila sudah terhubung, atau buka WhatsApp
            secara manual.
          </p>
        </div>
        <Btn variant="ghost" onClick={load}>
          <RefreshCw size={15} /> Muat ulang
        </Btn>
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-[4px] border border-garis bg-garis sm:grid-cols-3">
        {[
          {
            label: "Perlu ditagih",
            value: `${rows?.length ?? 0} catatan`,
          },
          { label: "Nilai piutang berjalan", value: rupiah(totalTagih) },
          {
            label: "Sudah lewat jatuh tempo",
            value: `${terlambat.length} catatan`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-kartu px-5 py-5">
            <p className="smallcaps text-abu">{s.label}</p>
            <p className="num mt-2 text-[1.35rem] font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
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
      </div>

      {!rows ? (
        <div className="mt-6 overflow-hidden rounded-[4px] border border-garis bg-kartu">
          <SkeletonRows rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 overflow-hidden rounded-[4px] border border-garis bg-kartu">
          <EmptyState
            icon={<MessageCircle size={26} strokeWidth={1.6} />}
            title="Tidak ada yang perlu ditagih"
            description="Semua tagihan pada filter ini sudah beres. Coba filter lain atau catat piutang baru."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filtered.map((r) => {
            const status = terkirim[r.id];
            return (
              <li
                key={r.id}
                className="overflow-hidden rounded-[4px] border border-garis bg-kartu"
              >
                <div className="grid gap-0 lg:grid-cols-[1fr_1.15fr]">
                  <div className="border-b border-garis px-6 py-5 lg:border-r lg:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="display text-[1.15rem] font-bold">
                          {r.customerName}
                        </h3>
                        <p className="num mt-1 text-[0.78rem] text-abu">
                          {r.phone ?? "tanpa nomor WhatsApp"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="num text-[1.15rem] font-semibold text-daun">
                          {rupiah(r.sisa)}
                        </div>
                        <div
                          className={`text-[0.72rem] ${
                            r.terlambat > 0 ? "text-merah" : "text-abu"
                          }`}
                        >
                          {r.terlambat > 0
                            ? `terlambat ${r.terlambat} hari`
                            : `jatuh tempo ${tanggal(r.dueDate)}`}
                        </div>
                      </div>
                    </div>

                    <dl className="mt-4 space-y-1.5 border-t border-garis pt-4 text-[0.8rem]">
                      <div className="flex justify-between gap-4">
                        <dt className="text-abu">Keterangan</dt>
                        <dd className="max-w-[14rem] truncate text-right">
                          {r.description}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-abu">Jatuh tempo</dt>
                        <dd>{tanggal(r.dueDate)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-abu">Pengingat terakhir</dt>
                        <dd>
                          {r.remindedAt
                            ? `${tanggal(r.remindedAt)} · ${jam(r.remindedAt)}`
                            : "belum pernah"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Btn
                        size="sm"
                        onClick={() => kirim(r.id)}
                        loading={kirimId === r.id}
                      >
                        <Send size={14} /> Kirim pengingat
                      </Btn>
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-[3px] border border-garis-2 px-3 py-1.5 text-[0.78rem] font-semibold text-tinta transition-colors hover:bg-kertas-2"
                      >
                        <MessageCircle size={14} /> Buka WhatsApp
                      </a>
                      <Btn
                        size="sm"
                        variant="quiet"
                        onClick={() => salin(r.message)}
                      >
                        <Copy size={14} /> Salin teks
                      </Btn>
                    </div>

                    {status ? (
                      <p className="mt-4 flex items-start gap-2 rounded-[3px] border border-daun/25 bg-daun-muda px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-daun">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                        {status}
                      </p>
                    ) : null}
                  </div>

                  {/* pratinjau pesan bergaya struk */}
                  <div className="bg-kertas-2/45 px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-kuning" />
                      <p className="smallcaps text-abu">Pratinjau pesan</p>
                    </div>
                    <div className="mt-3 rounded-[3px] border border-dashed border-garis-2 bg-kartu px-4 py-4">
                      <pre className="font-sans text-[0.82rem] leading-relaxed whitespace-pre-wrap text-tinta">
                        {r.message}
                      </pre>
                    </div>
                    <p className="mt-3 text-[0.72rem] leading-relaxed text-abu">
                      Pesan dapat diubah sebelum dikirim. Nomor yang belum
                      terdaftar di WhatsApp akan diarahkan ke tautan manual.
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {node}
    </div>
  );
}
