"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Send } from "lucide-react";
import {
  Btn,
  CountUp,
  EmptyState,
  Section,
  SkeletonRows,
  StatusPill,
} from "@/components/ui";
import type { AgingBucket, CustomerRow, DebtRow } from "@/lib/types";
import {
  BUCKET_COLOR,
  BUCKET_LABEL,
  hariIni,
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

export default function LaporanPage() {
  const [debts, setDebts] = useState<DebtRow[] | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const [d, c] = await Promise.all([
        fetch("/api/debts", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/customers", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!active) return;
      setDebts(d.debts ?? []);
      setCustomers(c.customers ?? []);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const berjalan = (debts ?? []).filter((d) => d.sisa > 0.5);
  const total = berjalan.reduce((a, b) => a + b.sisa, 0);
  const bucketTotals = ORDER.map((k) => ({
    key: k,
    value: berjalan.filter((d) => d.bucket === k).reduce((a, b) => a + b.sisa, 0),
    jumlah: berjalan.filter((d) => d.bucket === k).length,
  }));

  const perPelanggan = customers
    .filter((c) => c.sisaPiutang > 0.5)
    .sort((a, b) => b.sisaPiutang - a.sisaPiutang);

  const rincian = [...berjalan].sort(
    (a, b) =>
      ORDER.indexOf(a.bucket) - ORDER.indexOf(b.bucket) ||
      b.sisa - a.sisa,
  );

  function unduh() {
    const header = [
      "pelanggan",
      "keterangan",
      "jatuh_tempo",
      "nominal",
      "dibayar",
      "sisa",
      "umur",
    ];
    const lines = rincian.map((d) =>
      [
        d.customerName,
        `"${d.description.replace(/"/g, "'")}"`,
        tanggal(d.dueDate),
        d.amount,
        d.paid,
        d.sisa,
        BUCKET_LABEL[d.bucket],
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-piutang-aging.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* pita laporan */}
      <section className="relative overflow-hidden border-b border-garis bg-daun text-kertas">
        <Image
          src="/images/ledger-flatlay.jpg"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.16]"
          style={{ objectPosition: "70% 50%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(10,46,32,0.96) 0%, rgba(15,74,52,0.92) 60%, rgba(15,74,52,0.8) 100%)",
          }}
        />
        <div className="relative flex flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="smallcaps text-[#8dbf9c]">
              Laporan aging · {hariIni()}
            </p>
            <h2 className="display mt-4 max-w-lg text-[clamp(2.1rem,4.4vw,3.15rem)] leading-[1.02] font-[900] tracking-[-0.03em]">
              Seberapa tua piutang yang belum Anda terima?
            </h2>
            <p className="mt-4 max-w-md text-[0.92rem] leading-relaxed text-kertas/75">
              Piutang yang makin tua makin sulit ditagih. Gunakan laporan ini
              untuk memutus mana yang perlu ditagih hari ini.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Btn variant="cream" onClick={unduh}>
                <Download size={15} /> Unduh CSV
              </Btn>
              <Link href="/pengingat">
                <Btn
                  variant="ghost"
                  className="border-kertas/25 text-kertas hover:bg-white/10"
                >
                  <Send size={15} /> Tagih yang terlambat
                </Btn>
              </Link>
            </div>
          </div>

          <div className="lg:text-right">
            <p className="smallcaps text-[#8dbf9c]">Total piutang berjalan</p>
            <p className="display mt-2 text-[clamp(2.4rem,5.4vw,3.6rem)] leading-none font-[900] tracking-[-0.035em]">
              <CountUp value={total} format={(n) => rupiah(n)} />
            </p>
            <p className="mt-2 text-[0.82rem] text-kertas/65">
              {berjalan.length} catatan · {perPelanggan.length} pelanggan
            </p>
          </div>
        </div>
      </section>

      {/* kolom aging */}
      <section className="px-5 py-8 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-[4px] border border-garis bg-garis sm:grid-cols-2 lg:grid-cols-5">
          {bucketTotals.map((b, i) => {
            const pct = total > 0 ? (b.value / total) * 100 : 0;
            return (
              <div key={b.key} className="bg-kartu px-5 py-6">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-[1px]"
                    style={{ background: BUCKET_COLOR[b.key] }}
                  />
                  <p className="smallcaps text-abu">{BUCKET_LABEL[b.key]}</p>
                </div>
                <p className="num mt-3 text-[1.35rem] font-semibold leading-none">
                  <CountUp value={b.value} format={(n) => rupiah(n)} />
                </p>
                <p className="mt-1.5 text-[0.72rem] text-abu">
                  {b.jumlah} catatan · {pct.toFixed(0)}% dari total
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-kertas-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.1 + i * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ background: BUCKET_COLOR[b.key] }}
                    className="h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 px-5 pb-10 sm:px-8 lg:grid-cols-[1.55fr_1fr]">
        <Section title="Rincian piutang berjalan">
          {!debts ? (
            <SkeletonRows rows={6} />
          ) : rincian.length === 0 ? (
            <EmptyState
              title="Tidak ada piutang berjalan"
              description="Semua tagihan sudah lunas. Laporan aging akan terisi saat ada hutang baru."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left">
                <thead>
                  <tr className="border-b border-garis">
                    {["Pelanggan", "Umur tagihan", "Jatuh tempo", "Sisa"].map(
                      (h, i) => (
                        <th
                          key={h}
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
                  {rincian.map((d) => (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-kertas-2/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="text-[0.875rem] font-semibold">
                          {d.customerName}
                        </div>
                        <div className="max-w-[16rem] truncate text-[0.72rem] text-abu">
                          {d.description}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-semibold text-white"
                          style={{ background: BUCKET_COLOR[d.bucket] }}
                        >
                          {BUCKET_LABEL[d.bucket]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[0.82rem]">
                        {tanggal(d.dueDate)}
                      </td>
                      <td className="num px-5 py-3.5 text-right text-[0.92rem] font-semibold">
                        {rupiah(d.sisa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Ringkasan per pelanggan">
          {perPelanggan.length === 0 ? (
            <EmptyState
              title="Belum ada data"
              description="Ringkasan piutang per pelanggan akan tampil di sini."
            />
          ) : (
            <ul className="divide-y divide-garis">
              {perPelanggan.map((c) => (
                <li key={c.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[0.85rem] font-semibold">
                        {c.name}
                      </div>
                      <div className="text-[0.72rem] text-abu">
                        {c.jumlahTransaksi} catatan hutang
                      </div>
                    </div>
                    <div className="num text-[0.92rem] font-semibold">
                      {rupiah(c.sisaPiutang)}
                    </div>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-kertas-2">
                    <div
                      className="h-full bg-daun"
                      style={{
                        width: `${
                          c.jumlahPiutang > 0
                            ? (c.sisaPiutang / c.jumlahPiutang) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[0.7rem] text-abu">
                      dibayar {rupiah(c.sudahLunas)}
                    </span>
                    <StatusPill
                      status={
                        c.sisaPiutang <= 0.5
                          ? "lunas"
                          : c.sudahLunas > 0
                            ? "sebagian"
                            : "belum_lunas"
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
