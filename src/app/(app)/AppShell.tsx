"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Users,
  Wallet,
  NotebookPen,
} from "lucide-react";
import { Mark } from "@/components/Logo";
import type { SessionUser } from "@/lib/types";
import { tanggalPanjang } from "@/lib/format";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    hint: "Ringkasan piutang",
  },
  {
    href: "/pelanggan",
    label: "Pelanggan",
    icon: Users,
    hint: "Daftar peminjam",
  },
  {
    href: "/piutang",
    label: "Piutang",
    icon: NotebookPen,
    hint: "Catatan hutang",
  },
  {
    href: "/pembayaran",
    label: "Pembayaran",
    icon: Wallet,
    hint: "Penerimaan uang",
  },
  {
    href: "/laporan",
    label: "Laporan Aging",
    icon: BarChart3,
    hint: "Umur piutang",
  },
  {
    href: "/pengingat",
    label: "Pengingat WA",
    icon: Send,
    hint: "Tagih otomatis",
  },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pelanggan": "Pelanggan",
  "/piutang": "Piutang",
  "/pembayaran": "Pembayaran",
  "/laporan": "Laporan Aging",
  "/pengingat": "Pengingat WhatsApp",
};

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-8">
        <Mark size={34} tone="light" />
        <div>
          <div className="display text-[1.32rem] leading-none font-[900] text-kertas">
            Hutang<span className="text-[#8dbf9c]">Ku</span>
          </div>
          <div className="smallcaps mt-1 text-kertas/45">
            Piutang warung
          </div>
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-[3px] px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-kertas text-daun-tua"
                    : "text-kertas/70 hover:bg-white/8 hover:text-kertas"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-marker"
                    className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-full bg-[#8dbf9c]"
                  />
                ) : null}
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1 text-[0.875rem] font-semibold">
                  {item.label}
                </span>
                <span className="text-[0.62rem] tracking-wide text-current opacity-0 transition-opacity group-hover:opacity-60">
                  {item.hint}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-[3px] bg-white/6 px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8dbf9c] text-sm font-bold text-daun-tua">
            {user.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.82rem] font-semibold text-kertas">
              {user.name}
            </div>
            <div className="truncate text-[0.7rem] text-kertas/55">
              {user.warungName}
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
            className="rounded-full p-1.5 text-kertas/60 transition-colors hover:bg-white/10 hover:text-kertas"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* spine sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[15.5rem] shrink-0 bg-daun-tua lg:block">
        {nav}
      </aside>

      {/* mobile */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-tinta/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute top-0 left-0 h-full w-[16.5rem] bg-daun-tua"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              {nav}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-garis bg-kertas/92 px-5 py-4 backdrop-blur-sm sm:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="rounded-[3px] border border-garis-2 p-2 text-tinta lg:hidden"
          >
            <Menu size={17} />
          </button>
          <div className="min-w-0">
            <h1 className="display truncate text-[1.35rem] leading-none font-bold">
              {TITLES[pathname] ?? "HutangKu"}
            </h1>
            <p className="mt-1 text-[0.72rem] text-abu">
              {tanggalPanjang(new Date())} · {user.warungName}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/pengingat"
              className="hidden items-center gap-2 rounded-[3px] border border-garis-2 px-3 py-2 text-[0.78rem] font-semibold text-tinta transition-colors hover:bg-kertas-2 sm:inline-flex"
            >
              <Send size={14} /> Kirim pengingat
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-[3px] px-3 py-2 text-[0.78rem] font-semibold text-abu transition-colors hover:bg-kertas-2 hover:text-tinta lg:hidden"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
