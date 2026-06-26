-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 18, 2026 at 06:45 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sipinjam`
--

-- --------------------------------------------------------

--
-- Table structure for table `alat`
--

CREATE TABLE `alat` (
  `kode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jumlah` int NOT NULL,
  `kondisi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alat`
--

INSERT INTO `alat` (`kode`, `nama`, `kategori`, `jumlah`, `kondisi`) VALUES
('ALT-001', 'Ultrasonic Flaw Detector USM 100 - Waygate Technologies 150M5734', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT-002', 'Digital Earth Tester - Kyoritsu 4105A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT-003', 'Ultrasonic Thickness Gauge 2 - Dakota CMX', 'NDT Ultrasonik', 1, 'Service'),
('ALT-004', 'Thermometer Infrared - FLIR TG165-X', 'Alat Ukur Suhu', 1, 'Kondisi Baik'),
('ALT-005', 'Ultrasonic Thickness Gauge 1 - Cygnus MS-C4', 'NDT Ultrasonik', 1, 'Service'),
('ALT-006', 'High Voltage Insulation Tester - Kyoritsu KEW 3125A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT-007', 'Sound Level Meter - AZ Instrumen AZ8922', 'Alat Ukur Akustik', 1, 'Kondisi Baik'),
('ALT-008', 'Load Scale 5 Ton (Crane Scale) - CAS CASTON 1', 'Alat Ukur Berat', 1, 'Kondisi Baik'),
('ALT-009', 'Electromagnetic Yoke - Johnson & Allen JAY-SON', 'NDT Magnetik', 1, 'Kondisi Baik'),
('ALT-010', 'Tachometer - Lutron VT-8204', 'Alat Ukur Mekanik', 1, 'Kondisi Baik'),
('ALT-011', 'Vibration Meter - Lutron VT-8204', 'Alat Ukur Mekanik', 1, 'Kondisi Baik'),
('ALT-012', 'Load Scale 55 Ton - LCM Systems T24-HS-LS', 'Alat Ukur Berat', 1, 'Service'),
('ALT-013', 'High Voltage Insulation Tester - Kyoritsu 3005A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT-014', 'Laser Distance Meter - Krisbow KW06-526', 'Alat Ukur Jarak', 1, 'Kondisi Baik'),
('ALT-015', 'Ultrasonic Thickness Gauge 3 - Waygate Technologies DM5E', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT-016', 'Ultrasonic Thickness Gauge 4 - Inisize ISU-200D', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT-017', 'Permanent Yoke 1 - Western Instrumen WM-5C', 'NDT Magnetik', 1, 'Kondisi Baik'),
('ALT-018', 'Permanent Yoke 2 - Johnson & Allen JAY-SON110', 'NDT Magnetik', 1, 'Kondisi Kurang Baik'),
('ALT-019', 'Vakum Pump - Value', 'Peralatan', 2, 'Kondisi Baik'),
('ALT-020', 'Vakum Pump - Krisbow', 'Peralatan', 2, 'Kondisi Baik'),
('ALT-021', 'Box Vakum', 'Peralatan', 4, 'Kondisi Baik'),
('ALT-022', 'Chipping', 'Peralatan', 3, 'Kondisi Baik');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `nomor` int NOT NULL,
  `barcode_aset` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_alat_produksi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `peminjam` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `peminjam_instansi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `peminjam_divisi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `peminjam_kontak` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `persetujuan_koordinator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `petugas_kontrol_alat` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waktu_keluar` datetime(3) DEFAULT NULL,
  `waktu_kembali` datetime(3) DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `catatan_kembali` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `transaksi`
--
DELIMITER $$
CREATE TRIGGER `trg_kurangi_stok_approved` BEFORE UPDATE ON `transaksi` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_tambah_stok_dikembalikan` BEFORE UPDATE ON `transaksi` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instansi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `divisi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_card` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `name`, `role`, `instansi`, `divisi`, `account_status`, `id_card`, `password`, `registered_at`) VALUES
(1, 'budi@sipinjam.com', 'Ir. Budi Santoso', 'koordinator', 'PT. BKI Cabang Sorong', 'Produksi', 'approved', NULL, 'sipinjam123', '2026-06-19 03:08:40.916'),
(2, 'hendra@sipinjam.com', 'Hendra Saputra', 'petugas', 'PT. BKI Cabang Sorong', 'Gudang', 'approved', NULL, 'sipinjam123', '2026-06-19 03:08:40.916');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alat`
--
ALTER TABLE `alat`
  ADD PRIMARY KEY (`kode`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`nomor`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `nomor` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;