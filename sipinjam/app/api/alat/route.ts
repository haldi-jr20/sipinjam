import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
  try {
    const [alat] = await pool.query<RowDataPacket[]>('SELECT * FROM `Alat`');
    return NextResponse.json(alat);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alat' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Cek apakah kode sudah ada
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Alat` WHERE `kode` = ? LIMIT 1',
      [body.kode]
    );

    if (existing.length > 0) {
      // Update jumlah jika sudah ada
      await pool.query<ResultSetHeader>(
        'UPDATE `Alat` SET `jumlah` = `jumlah` + ? WHERE `kode` = ?',
        [body.jumlah || 1, body.kode]
      );
      const [updated] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM `Alat` WHERE `kode` = ?',
        [body.kode]
      );
      return NextResponse.json(updated[0]);
    } else {
      // Insert baru
      await pool.query<ResultSetHeader>(
        'INSERT INTO `Alat` (`kode`, `nama`, `kategori`, `jumlah`, `kondisi`) VALUES (?, ?, ?, ?, ?)',
        [body.kode, body.nama, body.kategori, body.jumlah || 1, body.kondisi || 'Baik']
      );
      const [newAlat] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM `Alat` WHERE `kode` = ?',
        [body.kode]
      );
      return NextResponse.json(newAlat[0]);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add alat' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.jumlah !== undefined) {
      updates.push('`jumlah` = ?');
      values.push(body.jumlah);
    }
    if (body.kondisi !== undefined) {
      updates.push('`kondisi` = ?');
      values.push(body.kondisi);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(body.kode);
    await pool.query<ResultSetHeader>(
      `UPDATE \`Alat\` SET ${updates.join(', ')} WHERE \`kode\` = ?`,
      values
    );

    const [alat] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `Alat` WHERE `kode` = ?',
      [body.kode]
    );
    return NextResponse.json(alat[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update alat' }, { status: 500 });
  }
}
