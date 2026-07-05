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

    const qty = parseInt(body.jumlah) || 1;
    const baseCode = body.kode;
    
    // Parse numeric part from 'ALT019'
    const prefixMatch = baseCode.match(/^(.*?)(\d+)$/);
    let prefix = "ALT";
    let startNum = 0;
    let numLength = 3;
    
    if (prefixMatch) {
      prefix = prefixMatch[1];
      startNum = parseInt(prefixMatch[2], 10);
      numLength = prefixMatch[2].length;
    }
    
    const insertedAlat = [];

    for (let i = 0; i < qty; i++) {
      const currentCode = prefixMatch 
        ? `${prefix}${String(startNum + i).padStart(numLength, '0')}`
        : (i === 0 ? baseCode : `${baseCode}-${i}`);

      // Insert individual item with jumlah = 1
      await pool.query<ResultSetHeader>(
        'INSERT INTO `Alat` (`kode`, `nama`, `kategori`, `jumlah`, `kondisi`) VALUES (?, ?, ?, 1, ?) ON DUPLICATE KEY UPDATE `jumlah` = 1, `kondisi` = ?',
        [currentCode, body.nama, body.kategori, body.kondisi || 'Baik', body.kondisi || 'Baik']
      );

      const [newAlat] = await pool.query<RowDataPacket[]>('SELECT * FROM `Alat` WHERE `kode` = ?', [currentCode]);
      if (newAlat.length > 0) insertedAlat.push(newAlat[0]);
    }

    return NextResponse.json(insertedAlat[0]);
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
    if (body.nama !== undefined) {
      updates.push('`nama` = ?');
      values.push(body.nama);
    }
    if (body.kategori !== undefined) {
      updates.push('`kategori` = ?');
      values.push(body.kategori);
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kode = searchParams.get('kode');
    if (!kode) return NextResponse.json({ error: 'Kode is required' }, { status: 400 });

    await pool.query('DELETE FROM `Alat` WHERE `kode` = ?', [kode]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete alat' }, { status: 500 });
  }
}

