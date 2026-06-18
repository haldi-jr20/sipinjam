import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sipinjam',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL diperlukan oleh sebagian besar MySQL cloud providers
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: true }
  }),
});

export default pool;
