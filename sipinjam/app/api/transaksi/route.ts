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
         \`peminjam_kontak\`, \`tujuan_peminjaman\`, \`tanggal_peminjaman\`, \`tanggal_pengembalian\`, \`persetujuan_koordinator\`, \`petugas_kontrol_alat\`, \`keterangan\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.barcode_aset ? JSON.stringify(body.barcode_aset) : null,
        body.nama_alat_produksi ? JSON.stringify(body.nama_alat_produksi) : '[]',
        body.peminjam,
        body.peminjam_instansi || '-',
        body.peminjam_divisi || '-',
        body.peminjam_kontak || '-',
        body.tujuan_peminjaman || null,
        body.tanggal_peminjaman || null,
        body.tanggal_pengembalian || null,
        body.persetujuan_koordinator || 'pending',
        body.petugas_kontrol_alat || null,
        body.keterangan || null,
      ]
    );

    const [newTrx] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Transaksi` WHERE `nomor` = ?',
      [result.insertId]
    );
    return NextResponse.json(newTrx[0]);
  } catch (error) {
    console.error(error);
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
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `persetujuan_koordinator` = ? WHERE `nomor` = ?',
          ['approved', id]
        );
        // Kurangi stok
        if (trx.barcode_aset) {
          try {
            const alatList = JSON.parse(trx.barcode_aset);
            for (const kode of alatList) {
              await pool.query('UPDATE `Alat` SET `jumlah` = `jumlah` - 1 WHERE `kode` = ?', [kode]);
            }
          } catch(e) {}
        }
        break;

      case "REJECT":
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `persetujuan_koordinator` = ?, `alasan_penolakan` = ? WHERE `nomor` = ?',
          ['rejected', body.alasan_penolakan || null, id]
        );
        break;

      case "KELUAR":
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `petugas_kontrol_alat` = ? WHERE `nomor` = ?',
          [petugas || null, id]
        );
        break;

      case "KEMBALI":
        const finalCatatan = `[Kondisi: ${body.kondisi || 'Baik'}] ${body.catatan || ''}`.trim();
        await pool.query<ResultSetHeader>(
          'UPDATE `Transaksi` SET `petugas_kontrol_alat` = ?, `catatan_kembali` = ? WHERE `nomor` = ?',
          [petugas || null, finalCatatan, id]
        );
        // Tambah stok & update kondisi alat
        if (trx.barcode_aset) {
          try {
            const alatList = JSON.parse(trx.barcode_aset);
            for (const kode of alatList) {
              await pool.query(
                'UPDATE `Alat` SET `jumlah` = `jumlah` + 1, `kondisi` = ? WHERE `kode` = ?',
                [body.kondisi || 'Baik', kode]
              );
            }
          } catch(e) {}
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
    console.error(error);
    return NextResponse.json({ error: 'Failed to update transaksi' }, { status: 500 });
  }
}

