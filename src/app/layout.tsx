import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HutangKu — Pencatat Piutang Warung & UMKM",
  description:
    "Catat siapa yang berhutang berapa, tag tepat waktu lewat WhatsApp, dan pantau laporan piutang aging untuk warung dan UMKM.",
};

const fonts = [
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap",
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        {fonts.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="min-h-screen bg-kertas text-tinta antialiased">
        <div
          aria-hidden
          className="paper-grain fixed inset-0 z-[45]"
          style={{ backgroundSize: "520px" }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
