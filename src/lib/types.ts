export type AgingBucket =
  | "belum_jatuh_tempo"
  | "1-7"
  | "8-30"
  | "31-60"
  | ">60";

export type DebtRow = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  description: string;
  amount: number;
  paid: number;
  sisa: number;
  issueDate: string;
  dueDate: string;
  status: "belum_lunas" | "sebagian" | "lunas";
  remindedAt: string | null;
  bucket: AgingBucket;
  terlambat: number;
};

export type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  jumlahPiutang: number;
  sisaPiutang: number;
  jumlahTransaksi: number;
  sudahLunas: number;
};

export type PaymentRow = {
  id: number;
  debtId: number;
  amount: number;
  method: string;
  note: string | null;
  paidAt: string;
  customerName: string;
  description: string;
};

export type Summary = {
  totalPiutang: number;
  jumlahPelangganPiutang: number;
  jumlahTagihan: number;
  terlambat: number;
  jatuhTempoMingguIni: number;
  terkumpulBulanIni: number;
  lunasCount: number;
  buckets: Record<AgingBucket, number>;
};

export type SessionUser = {
  id: number;
  name: string;
  warungName: string;
  email: string;
  phone: string | null;
};

export type Overview = {
  user: SessionUser;
  summary: Summary;
  debts: DebtRow[];
  customers: CustomerRow[];
  payments: PaymentRow[];
};

export type ReminderRow = {
  id: number;
  customerName: string;
  phone: string | null;
  description: string;
  sisa: number;
  dueDate: string;
  terlambat: number;
  remindedAt: string | null;
  message: string;
  link: string;
};
