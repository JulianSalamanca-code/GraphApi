const db = require('better-sqlite3')('./test.db');
db.exec('CREATE TABLE test (id INTEGER)');
console.log('SQLite works!');
db.close();
