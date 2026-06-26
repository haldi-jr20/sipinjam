import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
  try {
    const [transaksi] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Transaksi` ORDER BY `created_at` DESC'
    );
    return NextResponse.json(transaksi);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transaksi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`Transaksi\`
        (\`barcode_aset\`, \`nama_alat_produksi\`, \`peminjam\`, \`peminjam_instansi\`, \`peminjam_divisi\`,
         \`peminjam_kontak\`, \`persetujuan_koordinator\`, \`petugas_kontrol_alat\`, \`waktu_keluar\`, \`waktu_kembali\`, \`keterangan\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.barcode_aset || null,
        body.nama_alat_produksi,
        body.peminjam,
        body.peminjam_instansi || '-',
        body.peminjam_divisi || '-',
        body.peminjam_kontak || '-',
        body.persetujuan_koordinator || 'pending',
        body.petugas_kontrol_alat || null,
        body.waktu_keluar ? new Date(body.waktu_keluar) : null,
        body.waktu_kembali ? new Date(body.waktu_kembali) : null,
        body.keterangan || null,
      ]
    );

    const [newTrx] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Transaksi` WHERE `nomor` = ?',
      [result.insertId]
    );
    return NextResponse.json(newTrx[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaksi' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    const action = body.action; // "APPROVE" | "REJECT" | "KELUAR" | "KEMBALI"
    const petugas = body.petugas;

    // Cari transaksi
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Transaksi` WHERE `nomor` = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const trx = rows[0];

    switch (action) {
      case "APPROVE":
        // Stok otomatis dikurangi oleh trigger trg_kurangi_stok_approved
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `persetujuan_koordinator` = ? WHERE `nomor` = ?',
          ['approved', id]
        );
        break;

      case "REJECT":
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `persetujuan_koordinator` = ? WHERE `nomor` = ?',
          ['rejected', id]
        );
        break;

      case "KELUAR":
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `waktu_keluar` = NOW(3), `petugas_kontrol_alat` = ? WHERE `nomor` = ?',
          [petugas || null, id]
        );
        break;

      case "KEMBALI":
        // Stok otomatis ditambahkan oleh trigger trg_tambah_stok_dikembalikan
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `waktu_kembali` = NOW(3), `petugas_kontrol_alat` = ?, `catatan_kembali` = ? WHERE `nomor` = ?',
          [petugas || null, body.catatan || null, id]
        );
        // Update kondisi alat jika ada perubahan (misal: rusak ringan setelah dipakai)
        if (trx.barcode_aset && body.kondisi) {
          await pool.query<ResultSetHeader>(
            'UPDATE `Alat` SET `kondisi` = ? WHERE `kode` = ?',
            [body.kondisi, trx.barcode_aset]
          );
        }
        break;
    }

    // Return updated transaksi
    const [updated] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Transaksi` WHERE `nomor` = ?',
      [id]
    );
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaksi' }, { status: 500 });
  }
}
