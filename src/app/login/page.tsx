"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Store } from "lucide-react";
import { Btn, Field, Input } from "@/components/ui";
import { Mark } from "@/components/Logo";
import { hariIni } from "@/lib/format";

export default function LoginPage() {
  const [email, setEmail] = useState("sri@warungsri.id");
  const [password, setPassword] = useState("warung123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "auto";
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk. Coba lagi.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel kiri: suasana warung */}
      <aside className="relative hidden overflow-hidden bg-daun-tua lg:block">
        <img
          src="/images/login-warung.jpg"
          alt="Meja kasir warung kecil di sore hari"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          style={{ objectPosition: "50% 45%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,46,32,0.72) 0%, rgba(10,46,32,0.38) 38%, rgba(10,46,32,0.92) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Mark size={38} tone="light" />
            <span className="display text-2xl font-[900] text-kertas">
              Hutang<span className="text-[#9dc7a8]">Ku</span>
            </span>
          </div>

          <div className="max-w-md">
            <p className="smallcaps text-[#9dc7a8]">Buku kas warung, digital</p>
            <h1 className="display mt-5 text-[3.1rem] leading-[0.98] font-[900] tracking-[-0.02em] text-kertas">
              Catat hutangnya.
              <br />
              <span className="italic font-[600]">Tagih</span> tanpa
              <br />
              kehilangan teman.
            </h1>
            <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-kertas/80">
              Siapa yang berhutang berapa, kapan jatuh tempo, dan pengingat
              WhatsApp otomatis — semuanya dalam satu catatan yang tidak akan
              hilang seperti kertas nota.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-kertas/20 pt-7">
            {[
              ["12", "pelanggan aktif"],
              ["Rp 4,8 jt", "piutang tercatat"],
              ["96%", "terbayar tepat waktu"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="num text-xl font-semibold text-kertas">
                  {value}
                </div>
                <div className="smallcaps mt-1 text-kertas/55">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Panel kanan: formulir */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[25rem]"
        >
          <div className="lg:hidden">
            <Mark size={40} />
            <h1 className="display mt-5 text-4xl leading-none font-[900]">
              Hutang<span className="text-daun">Ku</span>
            </h1>
          </div>

          <p className="smallcaps mt-8 text-abu lg:mt-0">{hariIni()}</p>
          <h2 className="display mt-3 text-[2.15rem] leading-[1.05] font-bold tracking-[-0.02em]">
            Masuk ke akun warung Anda
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-abu">
            Lanjutkan mencatat piutang dan kirim pengingat jatuh tempo hari ini.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email">
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-abu-2"
                />
                <Input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="nama@warung.id"
                  required
                />
              </div>
            </Field>

            <Field label="Kata sandi">
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-abu-2"
                />
                <Input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </Field>

            {error ? (
              <div className="rounded-[3px] border border-merah/30 bg-merah-muda px-3.5 py-3 text-sm text-merah">
                {error}
              </div>
            ) : null}

            <Btn
              type="submit"
              loading={loading}
              className="w-full py-3 text-[0.92rem]"
            >
              {loading ? "Memeriksa…" : "Masuk ke dashboard"}
              {!loading && <ArrowRight size={16} />}
            </Btn>
          </form>

          <div className="mt-7 rounded-[4px] border border-dashed border-garis-2 bg-kartu/70 px-4 py-4">
            <div className="smallcaps flex items-center gap-2 text-abu">
              <Store size={13} /> Akun demo
            </div>
            <p className="mt-2 text-sm text-abu">
              Email <span className="num text-tinta">sri@warungsri.id</span> ·
              kata sandi <span className="num text-tinta">warung123</span>
            </p>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-abu-2">
            Data disimpan di database warung Anda sendiri. Pengingat WhatsApp
            dikirim melalui WA Gateway.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
