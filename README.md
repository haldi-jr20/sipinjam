# SiPinjam — Sistem Keluar Masuk Alat Produksi

Aplikasi web untuk mengelola peminjaman alat produksi dengan alur approval Supervisor.

## Tech Stack
- **Frontend & Backend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase *(disambungkan di tahap berikutnya)*
- **Barcode**: html5-qrcode *(akan ditambahkan)*

---

## Struktur Halaman

| Route | Role | Fungsi |
|---|---|---|
| `/login` | Semua | Login & pilih role |
| `/pengajuan` | Peminjam | Scan barcode + ajukan pinjam |
| `/supervisor` | Supervisor | Approve / reject pengajuan |
| `/petugas` | Petugas Kontrol | Catat keluar & pengembalian alat |

---

## Cara Mulai (Development)

```bash
# 1. Buat proyek Next.js baru
npx create-next-app@latest sipinjam --typescript --tailwind --app --src-dir=false
cd sipinjam

# 2. Install dependensi tambahan
npm install lucide-react html5-qrcode

# 3. Salin semua file dari folder ini ke dalam proyek

# 4. Jalankan dev server
npm run dev
```

Buka http://localhost:3000 — akan redirect ke `/login`.

---

## File Penting

```
app/
├── layout.tsx          ← Root layout (font, metadata)
├── page.tsx            ← Redirect ke /login
├── globals.css         ← Tailwind + custom classes
├── login/page.tsx      ← Halaman login
├── pengajuan/page.tsx  ← Peminjam: scan barcode & ajukan
├── supervisor/page.tsx ← Supervisor: approve/reject
└── petugas/page.tsx    ← Petugas: catat keluar & kembali

components/ui/
├── Navbar.tsx          ← Navbar per role (warna beda)
└── StatusBadge.tsx     ← Badge status transaksi

lib/
├── types.ts            ← TypeScript types & helper getStatusDisplay()
└── mock-data.ts        ← Data dummy (ganti Supabase nanti)
```

---

## Tahap Selanjutnya

### 1. Buat tabel Supabase
```sql
create table transaksi_alat (
  id                  uuid primary key default gen_random_uuid(),
  nomor_barcode       text not null,
  nama_alat           text not null,
  peminjam            text not null,
  divisi              text,
  keterangan          text,
  status_approval     text default 'pending',   -- pending | approved | rejected
  waktu_keluar        timestamptz,
  waktu_kembali       timestamptz,
  petugas_kontrol     text,
  supervisor          text,
  alasan_penolakan    text,
  created_at          timestamptz default now()
);

-- Row Level Security: aktifkan sesuai role
alter table transaksi_alat enable row level security;
```

### 2. Install Supabase client
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 3. Cari komentar `TODO` di setiap page
Setiap file `.tsx` sudah memiliki komentar `// TODO: Ganti MOCK dengan Supabase`
beserta contoh query Supabase yang siap di-uncomment.

### 4. Aktifkan Supabase Realtime
Supervisor mendapat notifikasi otomatis saat ada pengajuan baru.

### 5. Integrasi html5-qrcode (scan barcode sungguhan)
```tsx
import { Html5QrcodeScanner } from "html5-qrcode";

// Ganti fungsi handleScan() di pengajuan/page.tsx dengan:
const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
scanner.render(onScanSuccess, onScanError);
```
