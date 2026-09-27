export type AgingBucket = "belum_jatuh_tempo" | "1-7" | "8-30" | "31-60" | ">60";

export const rupiah = (value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  return "Rp " + new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));
};

export const rupiahShort = (value: number): string => {
  const n = Math.abs(value);
  if (n >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return rupiah(value);
};

export const tanggal = (value: string | Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const tanggalPanjang = (value: string | Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

export const jam = (value: string | Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const hariIni = (): string =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

/** Selisih hari dari hari ini (positif = sudah lewat jatuh tempo). */
export const hariTerlambat = (dueDate: string | Date): number => {
  const due = new Date(dueDate);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
};

export function bucketOf(dueDate: string | Date): AgingBucket {
  const d = hariTerlambat(dueDate);
  if (d <= 0) return "belum_jatuh_tempo";
  if (d <= 7) return "1-7";
  if (d <= 30) return "8-30";
  if (d <= 60) return "31-60";
  return ">60";
}

export const BUCKET_LABEL: Record<AgingBucket, string> = {
  belum_jatuh_tempo: "Belum jatuh tempo",
  "1-7": "Terlambat 1–7 hari",
  "8-30": "Terlambat 8–30 hari",
  "31-60": "Terlambat 31–60 hari",
  ">60": "Terlambat > 60 hari",
};

export const BUCKET_COLOR: Record<AgingBucket, string> = {
  belum_jatuh_tempo: "#2F6B4F",
  "1-7": "#C4881F",
  "8-30": "#B4402F",
  "31-60": "#8E2C22",
  ">60": "#4E1A14",
};

export const METODE_LABEL: Record<string, string> = {
  tunai: "Tunai",
  transfer: "Transfer bank",
  qris: "QRIS",
  ewallet: "E-wallet",
  lainnya: "Lainnya",
};
