/**
 * exportUtils.ts
 * Utility untuk ekspor data riwayat peminjaman ke format Excel (.xlsx) dan PDF.
 */

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseNamaAlat(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const counts: Record<string, number> = {};
      parsed.forEach((n: string) => (counts[n] = (counts[n] || 0) + 1));
      return Object.entries(counts)
        .map(([name, qty]) => `${name} (${qty})`)
        .join(", ");
    }
  } catch {}
  return raw;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusLabel(t: any): string {
  if (t.persetujuan_koordinator === "rejected") return "Ditolak";
  if (t.persetujuan_koordinator === "pending") return "Menunggu Persetujuan";
  if (t.catatan_kembali !== null && t.catatan_kembali !== undefined) return "Selesai";
  if (t.petugas_kontrol_alat) return "Sedang Dipinjam";
  return "Disetujui";
}

/** Ubah data transaksi mentah menjadi baris tabel siap ekspor */
function buildRows(transaksiList: any[]) {
  return transaksiList.map((t, idx) => ({
    No: idx + 1,
    "No. Transaksi": `TRX-${t.nomor}`,
    "Nama Peminjam": t.peminjam || "-",
    "Instansi": t.peminjam_instansi || "-",
    "Divisi": t.peminjam_divisi || "-",
    "No. HP": t.peminjam_kontak || "-",
    "Alat": parseNamaAlat(t.nama_alat_produksi),
    "Tujuan Peminjaman": t.tujuan_peminjaman || "-",
    "Tgl. Peminjaman": formatDate(t.tanggal_peminjaman),
    "Tgl. Pengembalian (Est.)": formatDate(t.tanggal_pengembalian),
    "Status": getStatusLabel(t),
    "Catatan Kondisi": t.catatan_kembali || "-",
    "Petugas": t.petugas_kontrol_alat || "-",
  }));
}

// ─── Export Excel ─────────────────────────────────────────────────────────────

export async function exportExcel(
  transaksiList: any[],
  bulan: string, // format YYYY-MM
  judul: string = "Riwayat Peminjaman"
) {
  const XLSX = await import("xlsx");
  const rows = buildRows(transaksiList);

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column width
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r: any) => String(r[key] ?? "").length)
    ),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Riwayat");

  const filename = `${judul.replace(/\s+/g, "_")}_${bulan}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── Export PDF ───────────────────────────────────────────────────────────────

export async function exportPDF(
  transaksiList: any[],
  bulan: string, // format YYYY-MM
  judul: string = "Riwayat Peminjaman"
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const rows = buildRows(transaksiList);
  const columns = Object.keys(rows[0] || {});
  const bodyData = rows.map((r: any) => columns.map((c) => r[c] ?? "-"));

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${judul}`, 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const [year, month] = bulan.split("-");
  const bulanLabel = new Date(Number(year), Number(month) - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  doc.text(`Periode: ${bulanLabel}`, 14, 23);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
    14,
    29
  );

  // Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: bodyData,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235], // biru BKI
      textColor: 255,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    columnStyles: {
      0: { cellWidth: 8 },  // No
      1: { cellWidth: 18 }, // No. Transaksi
      6: { cellWidth: 40 }, // Alat
      7: { cellWidth: 30 }, // Tujuan
    },
    margin: { left: 14, right: 14 },
  });

  const filename = `${judul.replace(/\s+/g, "_")}_${bulan}.pdf`;
  doc.save(filename);
}
