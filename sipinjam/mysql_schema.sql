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
('ALT001', 'Ultrasonic Flaw Detector USM 100 - Waygate Technologies 150M5734', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT002', 'Digital Earth Tester - Kyoritsu 4105A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT003', 'Ultrasonic Thickness Gauge 2 - Dakota CMX', 'NDT Ultrasonik', 1, 'Service'),
('ALT004', 'Thermometer Infrared - FLIR TG165-X', 'Alat Ukur Suhu', 1, 'Kondisi Baik'),
('ALT005', 'Ultrasonic Thickness Gauge 1 - Cygnus MS-C4', 'NDT Ultrasonik', 1, 'Service'),
('ALT006', 'High Voltage Insulation Tester - Kyoritsu KEW 3125A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT007', 'Sound Level Meter - AZ Instrumen AZ8922', 'Alat Ukur Akustik', 1, 'Kondisi Baik'),
('ALT008', 'Load Scale 5 Ton (Crane Scale) - CAS CASTON 1', 'Alat Ukur Berat', 1, 'Kondisi Baik'),
('ALT009', 'Electromagnetic Yoke - Johnson & Allen JAY-SON', 'NDT Magnetik', 1, 'Kondisi Baik'),
('ALT010', 'Tachometer - Lutron VT-8204', 'Alat Ukur Mekanik', 1, 'Kondisi Baik'),
('ALT011', 'Vibration Meter - Lutron VT-8204', 'Alat Ukur Mekanik', 1, 'Kondisi Baik'),
('ALT012', 'Load Scale 55 Ton - LCM Systems T24-HS-LS', 'Alat Ukur Berat', 1, 'Service'),
('ALT013', 'High Voltage Insulation Tester - Kyoritsu 3005A', 'Alat Ukur Listrik', 1, 'Kondisi Baik'),
('ALT014', 'Laser Distance Meter - Krisbow KW06-526', 'Alat Ukur Jarak', 1, 'Kondisi Baik'),
('ALT015', 'Ultrasonic Thickness Gauge 3 - Waygate Technologies DM5E', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT016', 'Ultrasonic Thickness Gauge 4 - Inisize ISU-200D', 'NDT Ultrasonik', 1, 'Kondisi Baik'),
('ALT017', 'Permanent Yoke 1 - Western Instrumen WM-5C', 'NDT Magnetik', 1, 'Kondisi Baik'),
('ALT018', 'Permanent Yoke 2 - Johnson & Allen JAY-SON110', 'NDT Magnetik', 1, 'Kondisi Kurang Baik'),
('ALT019', 'Vakum Pump - Value', 'Peralatan', 1, 'Kondisi Baik'),
('ALT020', 'Vakum Pump - Value', 'Peralatan', 1, 'Kondisi Baik'),
('ALT021', 'Vakum Pump - Krisbow', 'Peralatan', 1, 'Kondisi Baik'),
('ALT022', 'Vakum Pump - Krisbow', 'Peralatan', 1, 'Kondisi Baik'),
('ALT023', 'Box Vakum', 'Peralatan', 1, 'Kondisi Baik'),
('ALT024', 'Box Vakum', 'Peralatan', 1, 'Kondisi Baik'),
('ALT025', 'Box Vakum', 'Peralatan', 1, 'Kondisi Baik'),
('ALT026', 'Box Vakum', 'Peralatan', 1, 'Kondisi Baik'),
('ALT027', 'Chipping', 'Peralatan', 1, 'Kondisi Baik'),
('ALT028', 'Chipping', 'Peralatan', 1, 'Kondisi Baik'),
('ALT029', 'Chipping', 'Peralatan', 1, 'Kondisi Baik');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `nomor` int NOT NULL,
  `barcode_aset` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_alat_produksi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peminjam` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `peminjam_instansi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `peminjam_divisi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `peminjam_kontak` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '-',
  `tujuan_peminjaman` text COLLATE utf8mb4_unicode_ci,
  `persetujuan_koordinator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `alasan_penolakan` text COLLATE utf8mb4_unicode_ci,
  `petugas_kontrol_alat` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_peminjaman` date DEFAULT NULL,
  `tanggal_pengembalian` date DEFAULT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `catatan_kembali` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `role`, `account_status`, `password`, `registered_at`) VALUES
(1, 'koordinator@bki.com', 'koordinator', 'approved', 'koor2026', '2026-06-19 03:08:40.916'),
(2, 'petugas@bki.com', 'petugas', 'approved', 'petugas2026', '2026-06-19 03:08:40.916');

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
  ADD PRIMARY KEY (`id`);

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

