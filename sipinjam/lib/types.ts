// ─── Tipe Data Utama ──────────────────────────────────────────────────────────

export type Role = "peminjam" | "koordinator" | "petugas";

export type StatusApproval = "pending" | "approved" | "rejected";

export interface Transaksi {
  nomor: number;
  barcode_aset: string;
  nama_alat_produksi: string;
  peminjam: string;
  persetujuan_koordinator: StatusApproval;
  petugas_kontrol_alat: string | null;
  waktu_keluar: string | null;    // ISO 8601 — null jika belum dikeluarkan
  waktu_kembali: string | null;   // ISO 8601 — null jika belum dikembalikan
}

export interface Alat {
  nomor_barcode: string;
  nama_alat: string;
  kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat";
  lokasi_simpan?: string;
}

// Payload saat submit pengajuan baru
export type PengajuanPayload = Pick<
  Transaksi,
  "barcode_aset" | "nama_alat_produksi" | "peminjam"
>;

// Status turunan dari Transaksi (untuk tampilan badge)
export type StatusDisplay =
  | "Menunggu Persetujuan"
  | "Disetujui"
  | "Ditolak"
  | "Sedang Dipinjam"
  | "Dikembalikan";

export function getStatusDisplay(t: Transaksi): StatusDisplay {
  if (t.persetujuan_koordinator === "rejected")               return "Ditolak";
  if (t.persetujuan_koordinator === "pending")                return "Menunggu Persetujuan";
  if (t.persetujuan_koordinator === "approved" && !t.waktu_keluar)  return "Disetujui";
  if (t.waktu_keluar && !t.waktu_kembali)             return "Sedang Dipinjam";
  return "Dikembalikan";
}
