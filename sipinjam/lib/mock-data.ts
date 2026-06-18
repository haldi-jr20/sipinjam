import type { Transaksi, Alat } from "./types";

// ─── Database Alat (nanti ganti query ke Supabase) ────────────────────────────

export const MOCK_ALAT: Alat[] = [
  { nomor_barcode: "ALT-001", nama_alat: "Gerinda Tangan Bosch GWS 7-115",   kondisi: "Baik", lokasi_simpan: "Gudang A-1" },
  { nomor_barcode: "ALT-002", nama_alat: "Bor Listrik Makita HP1641",          kondisi: "Baik", lokasi_simpan: "Gudang A-2" },
  { nomor_barcode: "ALT-003", nama_alat: "Multimeter Digital Fluke 117",       kondisi: "Baik", lokasi_simpan: "Gudang B-1" },
  { nomor_barcode: "ALT-004", nama_alat: "Las MIG Miller Multimatic 215",      kondisi: "Baik", lokasi_simpan: "Gudang C-1" },
  { nomor_barcode: "ALT-005", nama_alat: "Kunci Torsi Digital Stahlwille",     kondisi: "Baik", lokasi_simpan: "Gudang A-3" },
  { nomor_barcode: "ALT-006", nama_alat: "Oscilloscope Rigol DS1054Z",         kondisi: "Baik", lokasi_simpan: "Lab Elektro" },
];

// ─── Data Transaksi Contoh ────────────────────────────────────────────────────

const now = new Date();
const ago = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const MOCK_TRANSAKSI: Transaksi[] = [
  {
    nomor: 1,
    barcode_aset: "ALT-001",
    nama_alat_produksi: "Gerinda Tangan Bosch GWS 7-115",
    peminjam: "Ahmad Fauzi",
    persetujuan_koordinator: "pending",
    waktu_keluar: null,
    waktu_kembali: null,
    petugas_kontrol_alat: null,
  },
  {
    nomor: 2,
    barcode_aset: "ALT-002",
    nama_alat_produksi: "Bor Listrik Makita HP1641",
    peminjam: "Rudi Hartono",
    persetujuan_koordinator: "approved",
    waktu_keluar: null,
    waktu_kembali: null,
    petugas_kontrol_alat: null,
  },
  {
    nomor: 3,
    barcode_aset: "ALT-003",
    nama_alat_produksi: "Multimeter Digital Fluke 117",
    peminjam: "Siti Rahmah",
    persetujuan_koordinator: "approved",
    waktu_keluar: ago(4),
    waktu_kembali: null,
    petugas_kontrol_alat: "Hendra Saputra",
  },
  {
    nomor: 4,
    barcode_aset: "ALT-005",
    nama_alat_produksi: "Kunci Torsi Digital Stahlwille",
    peminjam: "Agus Purnomo",
    persetujuan_koordinator: "rejected",
    waktu_keluar: null,
    waktu_kembali: null,
    petugas_kontrol_alat: null,
  },
  {
    nomor: 5,
    barcode_aset: "ALT-004",
    nama_alat_produksi: "Las MIG Miller Multimatic 215",
    peminjam: "Dewi Lestari",
    persetujuan_koordinator: "approved",
    waktu_keluar: ago(26),
    waktu_kembali: ago(22),
    petugas_kontrol_alat: "Hendra Saputra",
  },
];
