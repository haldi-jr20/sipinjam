const mysql = require('mysql2/promise');
async function updateDB() {
  try {
    const c = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'sipinjam'});
    await c.query('ALTER TABLE user DROP COLUMN name');
    console.log('Dropped name column');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
updateDB();
