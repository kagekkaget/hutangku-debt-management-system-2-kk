"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock3,
  Plus,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Btn,
  CountUp,
  EmptyState,
  Section,
  SkeletonRows,
  StatusPill,
} from "@/components/ui";
import type { AgingBucket, Overview } from "@/lib/types";
import {
  BUCKET_COLOR,
  BUCKET_LABEL,
  METODE_LABEL,
  hariIni,
  jam,
  rupiah,
  tanggal,
} from "@/lib/format";

const ORDER: AgingBucket[] = [
  "belum_jatuh_tempo",
  "1-7",
  "8-30",
  "31-60",
  ">60",
];

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/overview", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(null);
    } catch {
      setError("Gagal memuat ringkasan. Muat ulang halaman.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;
  const buckets = s?.buckets;
  const totalBucket = buckets
    ? ORDER.reduce((a, k) => a + buckets[k], 0)
    : 0;

  const perluTagih = (data?.debts ?? [])
    .filter((d) => d.sisa > 0.5)
    .sort((a, b) => b.terlambat - a.terlambat || b.sisa - a.sisa)
    .slice(0, 7);

  const pelangganTop = (data?.customers ?? [])
    .filter((c) => c.sisaPiutang > 0.5)
    .sort((a, b) => b.sisaPiutang - a.sisaPiutang)
    .slice(0, 5);

  return (
    <div>
      {/* ---------------------------------------------------------- pita aging */}
      <section className="relative overflow-hidden bg-daun-tua text-kertas">
        <img
          src="/images/ledger-flatlay.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
          style={{ objectPosition: "25% 55%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(102deg, rgba(10,46,32,0.97) 0%, rgba(13,62,43,0.93) 48%, rgba(15,74,52,0.8) 100%)",
          }}
        />

        <div className="relative grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14 lg:py-14">
          <div>
            <p className="smallcaps text-[#8dbf9c]">
              Ringkasan piutang · {hariIni()}
            </p>

            <div className="mt-5 flex items-end gap-3">
              <h2 className="display text-[clamp(2.9rem,7.2vw,5.1rem)] leading-[0.9] font-[900] tracking-[-0.035em]">
                {s ? (
                  <CountUp
                    value={s.totalPiutang}
                    format={(n) => rupiah(n)}
                  />
                ) : (
                  <span className="opacity-40">Rp —</span>
                )}
              </h2>
            </div>
            <p className="mt-3 max-w-md text-[0.92rem] leading-relaxed text-kertas/70">
              Total piutang berjalan dari{" "}
              <span className="font-semibold text-kertas">
                {s?.jumlahTagihan ?? 0} catatan hutang
              </span>{" "}
              milik {s?.jumlahPelangganPiutang ?? 0} pelanggan yang belum lunas.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] bg-kertas/15">
              {[
                {
                  label: "Terlambat",
                  value: s?.terlambat ?? 0,
                  icon: Clock3,
                  tone: "text-[#e79b8c]",
                },
                {
                  label: "Jatuh tempo 7 hari",
                  value: s?.jatuhTempoMingguIni ?? 0,
                  icon: TrendingUp,
                  tone: "text-[#e7c584]",
                },
                {
                  label: "Terkumpul bulan ini",
                  value: s?.terkumpulBulanIni ?? 0,
                  icon: Wallet,
                  tone: "text-[#8dbf9c]",
                },
              ].map((item) => (
                <div key={item.label} className="bg-daun-tua/85 px-4 py-4">
                  <div className="smallcaps flex items-center gap-1.5 text-kertas/55">
                    <item.icon size={12} className={item.tone} />
                    {item.label}
                  </div>
                  <div className="num mt-2 text-[1.02rem] font-semibold">
                    <CountUp value={item.value} format={(n) => rupiah(n)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href="/piutang?baru=1">
                <Btn variant="cream">
                  <Plus size={15} /> Catat piutang baru
                </Btn>
              </Link>
              <Link href="/pengingat">
                <Btn
                  variant="ghost"
                  className="border-kertas/25 text-kertas hover:bg-white/10"
                >
                  <Send size={15} /> Kirim pengingat jatuh tempo
                </Btn>
              </Link>
            </div>
          </div>

          {/* bar aging */}
          <div className="self-center">
            <div className="flex items-baseline justify-between">
              <p className="smallcaps text-[#8dbf9c]">Aging piutang</p>
              <p className="num text-[0.72rem] text-kertas/55">
                {rupiah(totalBucket)}
              </p>
            </div>

            <div className="mt-4 flex h-[2.15rem] w-full overflow-hidden rounded-[2px] bg-white/10">
              {ORDER.map((k) => {
                const value = buckets?.[k] ?? 0;
                const pct = totalBucket > 0 ? (value / totalBucket) * 100 : 0;
                return (
                  <motion.div
                    key={k}
                    title={`${BUCKET_LABEL[k]} — ${rupiah(value)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.85,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.12,
                    }}
                    style={{ background: BUCKET_COLOR[k] }}
                    className="h-full border-r border-daun-tua/40 last:border-r-0"
                  />
                );
              })}
            </div>

            {/* tick */}
            <div className="relative mt-1 h-3">
              {[0, 25, 50, 75, 100].map((t) => (
                <span
                  key={t}
                  className="absolute top-0 h-2 w-px bg-kertas/25"
                  style={{ left: `${t}%` }}
                />
              ))}
            </div>

            <ul className="mt-3 space-y-0">
              {ORDER.map((k) => {
                const value = buckets?.[k] ?? 0;
                const pct = totalBucket > 0 ? (value / totalBucket) * 100 : 0;
                return (
                  <li
                    key={k}
                    className="flex items-center gap-3 border-b border-kertas/10 py-2 last:border-b-0"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                      style={{ background: BUCKET_COLOR[k] }}
                    />
                    <span className="flex-1 text-[0.82rem] text-kertas/80">
                      {BUCKET_LABEL[k]}
                    </span>
                    <span className="num w-20 text-right text-[0.82rem] text-kertas/55">
                      {pct.toFixed(0)}%
                    </span>
                    <span className="num w-28 text-right text-[0.85rem] font-medium">
                      {rupiah(value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- dua kolom */}
      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.5fr_1fr]">
        <Section
          title="Perlu ditagih"
          action={
            <Link
              href="/piutang"
              className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-daun hover:underline"
            >
              Lihat semua <ArrowUpRight size={14} />
            </Link>
          }
        >
          {!data ? (
            <SkeletonRows rows={5} />
          ) : error ? (
            <EmptyState title="Data belum termuat" description={error} />
          ) : perluTagih.length === 0 ? (
            <EmptyState
              title="Tidak ada piutang berjalan"
              description="Semua catatan hutang sudah lunas. Catat piutang baru saat pelanggan berhutang lagi."
              action={
                <Link href="/piutang?baru=1">
                  <Btn>
                    <Plus size={15} /> Catat piutang
                  </Btn>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead>
                  <tr className="border-b border-garis">
                    {["Pelanggan", "Keterangan", "Jatuh tempo", "Sisa", ""].map(
                      (h, i) => (
                        <th
                          key={h + i}
                          className={`smallcaps px-5 py-3 text-abu ${
                            i === 3 ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {perluTagih.map((d) => (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-kertas-2/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-daun-muda text-[0.7rem] font-bold text-daun">
                            {d.customerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[0.875rem] font-semibold">
                              {d.customerName}
                            </div>
                            <div className="text-[0.72rem] text-abu">
                              {d.customerPhone ?? "tanpa nomor"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[0.82rem] text-abu">
                        {d.description}
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="num px-5 py-3.5 text-right text-[0.92rem] font-semibold">
                        {rupiah(d.sisa)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <StatusPill status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Pembayaran terakhir">
            {!data ? (
              <SkeletonRows rows={4} />
            ) : data.payments.length === 0 ? (
              <EmptyState
                title="Belum ada pembayaran"
                description="Setiap penerimaan uang akan tercatat di sini."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {data.payments.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-kertas-2 text-abu">
                      <Wallet size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.85rem] font-semibold">
                        {p.customerName}
                      </div>
                      <div className="truncate text-[0.72rem] text-abu">
                        {p.description} · {METODE_LABEL[p.method] ?? p.method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-[0.85rem] font-semibold text-daun">
                        + {rupiah(p.amount)}
                      </div>
                      <div className="text-[0.7rem] text-abu">
                        {tanggal(p.paidAt)} · {jam(p.paidAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Piutang terbesar per pelanggan">
            {pelangganTop.length === 0 ? (
              <EmptyState
                title="Belum ada piutang aktif"
                description="Pelanggan dengan sisa tagihan akan muncul di sini."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {pelangganTop.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="num w-5 text-[0.72rem] text-abu-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate text-[0.85rem] font-medium">
                      {c.name}
                    </span>
                    <span className="num text-[0.85rem] font-semibold">
                      {rupiah(c.sisaPiutang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
