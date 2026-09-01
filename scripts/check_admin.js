const db = require('./config/db');
(async () => {
  const [rows] = await db.promise().query('SELECT id, email, password FROM users WHERE role = ? LIMIT 1', ['admin']);
  if (!rows.length) { console.log('No admin found'); db.end(); return; }
  console.log({ email: rows[0].email, passLen: rows[0].password.length, passPrefix: rows[0].password.slice(0,7) });
  db.end();
})();