-- DDL untuk Database Sipinjam (Berdasarkan Prisma Schema)

-- Buat tabel User
CREATE TABLE IF NOT EXISTS `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `instansi` VARCHAR(191) NOT NULL,
  `divisi` VARCHAR(191) NOT NULL,
  `account_status` VARCHAR(191) NOT NULL,
  `id_card` VARCHAR(191) NULL,
  `password` VARCHAR(191) NOT NULL,
  `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat tabel Alat
CREATE TABLE IF NOT EXISTS `Alat` (
  `kode` VARCHAR(191) PRIMARY KEY,
  `nama` VARCHAR(191) NOT NULL,
  `kategori` VARCHAR(191) NOT NULL,
  `jumlah` INT NOT NULL,
  `kondisi` VARCHAR(191) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat tabel Transaksi
CREATE TABLE IF NOT EXISTS `Transaksi` (
  `nomor` INT AUTO_INCREMENT PRIMARY KEY,
  `barcode_aset` VARCHAR(191) NULL,
  `nama_alat_produksi` VARCHAR(191) NOT NULL,
  `peminjam` VARCHAR(191) NOT NULL,
  `peminjam_instansi` VARCHAR(191) NOT NULL DEFAULT '-',
  `peminjam_divisi` VARCHAR(191) NOT NULL DEFAULT '-',
  `peminjam_kontak` VARCHAR(191) NOT NULL DEFAULT '-',
  `persetujuan_koordinator` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `petugas_kontrol_alat` VARCHAR(191) NULL,
  `waktu_keluar` DATETIME(3) NULL,
  `waktu_kembali` DATETIME(3) NULL,
  `keterangan` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert data awal untuk Alat
INSERT IGNORE INTO `Alat` (`kode`, `nama`, `kategori`, `jumlah`, `kondisi`) VALUES
  ('ALT-001', 'Gerinda Tangan Bosch GWS 7-115', 'Gerinda', 5, 'Baik'),
  ('ALT-002', 'Bor Listrik Makita HP1641', 'Bor', 3, 'Baik'),
  ('ALT-003', 'Multimeter Digital Fluke 117', 'Alat Ukur', 2, 'Baik');

-- Insert initial users
INSERT IGNORE INTO `User` (`email`, `name`, `role`, `instansi`, `divisi`, `account_status`, `password`) VALUES
  ('budi@sipinjam.com', 'Ir. Budi Santoso', 'koordinator', 'PT. BKI Cabang Sorong', 'Produksi', 'approved', 'sipinjam123'),
  ('hendra@sipinjam.com', 'Hendra Saputra', 'petugas', 'PT. BKI Cabang Sorong', 'Gudang', 'approved', 'sipinjam123');

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Otomatis kurangi stok saat transaksi disetujui (approved)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Trigger ini mengurangi jumlah alat di tabel `Alat` sebanyak 1 unit
-- ketika kolom `persetujuan_koordinator` berubah menjadi 'approved'.
-- Hanya berjalan jika barcode_aset tidak NULL dan status benar-benar berubah.
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //

CREATE TRIGGER trg_kurangi_stok_approved
BEFORE UPDATE ON `Transaksi`
FOR EACH ROW
BEGIN
  -- Hanya jalankan jika status persetujuan berubah menjadi 'approved'
  -- dan sebelumnya BUKAN 'approved' (mencegah pengurangan dobel)
  IF NEW.persetujuan_koordinator = 'approved'
     AND OLD.persetujuan_koordinator <> 'approved'
     AND NEW.barcode_aset IS NOT NULL
  THEN
    UPDATE `Alat`
    SET `jumlah` = `jumlah` - 1
    WHERE `kode` = NEW.barcode_aset;
  END IF;
END //

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Otomatis tambah stok saat alat dikembalikan
-- ═══════════════════════════════════════════════════════════════════════════════
-- Trigger ini menambah jumlah alat di tabel `Alat` sebanyak 1 unit
-- ketika kolom `waktu_kembali` diisi (dari NULL menjadi memiliki nilai).
-- Ini menandakan bahwa alat telah dikembalikan oleh peminjam.
-- ═══════════════════════════════════════════════════════════════════════════════

DELIMITER //

CREATE TRIGGER trg_tambah_stok_dikembalikan
BEFORE UPDATE ON `Transaksi`
FOR EACH ROW
BEGIN
  -- Hanya jalankan jika waktu_kembali baru saja diisi (sebelumnya NULL)
  -- dan barcode_aset tersedia
  IF OLD.waktu_kembali IS NULL
     AND NEW.waktu_kembali IS NOT NULL
     AND NEW.barcode_aset IS NOT NULL
  THEN
    UPDATE `Alat`
    SET `jumlah` = `jumlah` + 1
    WHERE `kode` = NEW.barcode_aset;
  END IF;
END //

DELIMITER ;
