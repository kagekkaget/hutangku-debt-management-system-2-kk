/**
 * Seed data demo HutangKu.
 * Jalankan: node scripts/seed.mjs
 */
import "dotenv/config";
import { Pool } from "pg";
import { randomBytes, scryptSync } from "node:crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hash = (pw) => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 32).toString("hex")}`;
};

const day = 86_400_000;
const now = Date.now();
const iso = (offsetDays, hour = 9) => {
  const d = new Date(now + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const customers = [
  ["Pak Dedi Susanto", "081234567801", "Jl. Melati No. 12, RT 03", "Langganan beras, bayar tiap tanggal muda"],
  ["Bu Ratna Sari", "081234567802", "Jl. Kenanga No. 4", "Sering beli kebutuhan dapur eceran"],
  ["Mas Yudi Pratama", "081234567803", "Gang Mawar No. 7", "Ojek pangkalan depan pasar"],
  ["Bu Siti Aminah", "081234567804", "Jl. Anggrek No. 21", "Bayar mingguan, jangan lewat tanggal 25"],
  ["Pak Harjono", "081234567805", "Dusun Timur, RT 05", "Supplier telur, saling tagih tiap bulan"],
  ["Mbak Lestari", "081234567806", "Jl. Cempaka No. 9", "Pemilik warung kopi sebelah"],
  ["Pak Slamet Riyadi", "081234567807", "Jl. Mawar No. 33", "Sering beli pulsa untuk anak sekolah"],
  ["Bu Endang Wahyuni", "081234567808", "Jl. Flamboyan No. 2", "Belanja bulanan, bayar setengah dulu"],
  ["Rizky Nugraha", "081234567809", "Kos Putri Melati, Kamar 4", "Mahasiswa, bayar saat kiriman masuk"],
  ["Pak Tono Sukirman", "081234567810", "Jl. Diponegoro No. 41", "Sopir angkot, langganan rokok"],
  ["Ibu Marni", "081234567811", "RT 01, Blok C", "Jualan gorengan, butuh minyak goreng rutin"],
  ["Fajar Ramadhan", "081234567812", "Jl. Pahlawan No. 8", "Mekanik bengkel depan"],
];

/** [idxPelanggan, keterangan, nominal, hariLaluCatat, hariDariSekarangJatuhTempo, rasioBayar] */
const debts = [
  [0, "Beras 5kg + minyak goreng 2L", 238000, -62, -38, 1],
  [0, "Beras 10kg + gula 2kg", 265000, -34, -12, 0.4],
  [0, "Gas 3kg + telur 2kg", 128000, -12, 18, 0],
  [1, "Sembako bulanan (gula, tepung, telur)", 312000, -70, -46, 1],
  [1, "Mie instan 1 dus + teh celup", 96000, -40, -22, 0.5],
  [1, "Sabun cuci + deterjen 2kg", 78000, -8, 22, 0],
  [2, "Pulsa 25rb + token listrik 50rb", 82000, -55, -31, 1],
  [2, "Rokok 2 bungkus + kopi sachet", 64000, -20, -4, 0],
  [2, "Bensin eceran 3L", 36000, -3, 11, 0],
  [3, "Beras 5kg + telur 2kg", 176000, -48, -26, 0.75],
  [3, "Minyak goreng 5L", 92000, -15, 9, 0],
  [4, "Telur 3kg untuk warung", 168000, -66, -42, 1],
  [4, "Gula 5kg + kopi sachet 1 pak", 215000, -28, -6, 0.3],
  [4, "Tepung terigu 10kg", 138000, -6, 28, 0],
  [5, "Air galon 2 + snack", 62000, -36, -18, 1],
  [5, "Kopi sachet 1 pak + gula 2kg", 88000, -11, 13, 0],
  [6, "Pulsa 50rb + token 100rb", 155000, -73, -50, 1],
  [6, "Pulsa 25rb", 30000, -25, -9, 0],
  [6, "Rokok 3 bungkus", 72000, -5, 16, 0],
  [7, "Sembako bulanan lengkap", 428000, -30, -2, 0.5],
  [7, "Popok bayi + susu kaleng", 214000, -9, 25, 0],
  [8, "Mie instan 1 dus + air mineral", 74000, -22, -7, 0],
  [8, "Pulsa 20rb + rokok 1 bungkus", 48000, -4, 21, 0],
  [9, "Rokok 2 slop", 340000, -80, -58, 0.6],
  [9, "Kopi sachet + gorengan", 45000, -18, 5, 0],
  [10, "Minyak goreng 10L untuk gorengan", 186000, -33, -14, 0.8],
  [10, "Tepung terigu 5kg + gula 3kg", 132000, -7, 27, 0],
  [11, "Oli mesin + bensin eceran 5L", 118000, -26, -3, 0],
  [11, "Snack + rokok 2 bungkus", 58000, -2, 30, 0],
];

/** [idxDebt, rasioDariSisa, hariLaluBayar, metode, catatan] */
const payments = [
  [0, 1, -30, "tunai", "Lunas, sisanya dibayar pas gajian"],
  [1, 0.4, -10, "transfer", "Bayar sebagian dulu"],
  [3, 1, -35, "tunai", ""],
  [4, 0.5, -14, "qris", "Sisanya minggu depan"],
  [6, 1, -24, "tunai", ""],
  [9, 0.75, -20, "transfer", "Titip lewat anak"],
  [11, 1, -30, "tunai", ""],
  [12, 0.3, -5, "tunai", "Baru bayar sedikit"],
  [14, 1, -12, "qris", ""],
  [16, 1, -40, "tunai", ""],
  [19, 0.5, -8, "ewallet", "Bayar via e-wallet"],
  [23, 0.6, -30, "tunai", "Sisa dicicil"],
  [25, 0.8, -16, "transfer", ""],
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (name, email, password_hash, warung_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [
        "Sri Wahyuni",
        "sri@warungsri.id",
        hash("warung123"),
        "Warung Sembako Bu Sri",
        "081290874412",
      ],
    );
    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["sri@warungsri.id"],
    );
    const userId = userRows[0].id;

    await client.query("DELETE FROM payments WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM debts WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM customers WHERE user_id = $1", [userId]);

    const customerIds = [];
    for (const [name, phone, address, notes] of customers) {
      const { rows } = await client.query(
        `INSERT INTO customers (user_id, name, phone, address, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, name, phone, address, notes, iso(-120 + customerIds.length * 3)],
      );
      customerIds.push(rows[0].id);
    }

    const debtIds = [];
    for (const [idx, desc, amount, issued, due, ratio] of debts) {
      const paid = Math.round((amount * ratio) / 1000) * 1000;
      const status = paid <= 0 ? "belum_lunas" : paid >= amount ? "lunas" : "sebagian";
      const { rows } = await client.query(
        `INSERT INTO debts
           (user_id, customer_id, description, amount, issue_date, due_date, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          userId,
          customerIds[idx],
          desc,
          amount.toFixed(2),
          iso(issued),
          iso(due, 17),
          status,
          iso(issued),
        ],
      );
      debtIds.push(rows[0].id);
    }

    for (const [dIdx, ratio, when, method, note] of payments) {
      const total = debts[dIdx][2];
      const amount = Math.round((total * ratio) / 1000) * 1000;
      await client.query(
        `INSERT INTO payments (debt_id, user_id, amount, method, note, paid_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [debtIds[dIdx], userId, amount.toFixed(2), method, note || null, iso(when)],
      );
    }

    await client.query("COMMIT");
    const { rows: c } = await client.query(
      "SELECT count(*) FROM customers WHERE user_id = $1",
      [userId],
    );
    const { rows: d } = await client.query(
      "SELECT count(*) FROM debts WHERE user_id = $1",
      [userId],
    );
    const { rows: p } = await client.query(
      "SELECT count(*) FROM payments WHERE user_id = $1",
      [userId],
    );
    console.log(
      `Seed selesai: ${c[0].count} pelanggan, ${d[0].count} piutang, ${p[0].count} pembayaran.`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
