import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
  try {
    const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM `User`');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Cek email duplikat
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT `id` FROM `User` WHERE `email` = ? LIMIT 1',
      [body.email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO \`User\` (\`email\`, \`role\`, \`account_status\`, \`password\`)
       VALUES (?, ?, ?, ?)`,
      [
        body.email,
        body.role,
        body.account_status,
        body.password,
      ]
    );

    // Ambil user yang baru dibuat
    const [newUser] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `User` WHERE `id` = ?',
      [result.insertId]
    );

    return NextResponse.json(newUser[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
