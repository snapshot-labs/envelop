import mysql from 'mysql';
// @ts-ignore
import Pool from 'mysql/lib/Pool';
// @ts-ignore
import Connection from 'mysql/lib/Connection';
import bluebird from 'bluebird';
import { ConnectionString } from 'connection-string';
import fs from 'fs';

// @ts-ignore
const config = new ConnectionString(process.env.DATABASE_URL || '');
bluebird.promisifyAll([Pool, Connection]);
const db: any = mysql.createPool({
  user: config.user,
  password: config.password,
  host: config.hosts?.[0].name,
  port: config.hosts?.[0].port
});
const dbName = config.path?.[0];

if (!dbName?.endsWith('_test')) {
  console.error('Invalid test database name. Must end with _test');
  process.exit(1);
}

async function run() {
  const splitToken = ');';

  console.log('Start test database setup');

  console.info(`- Dropping existing database: ${dbName}`);
  await db.queryAsync(`DROP DATABASE IF EXISTS ${dbName}`);

  console.info(`- Creating new database: ${dbName}`);
  await db.queryAsync(`CREATE DATABASE ${dbName}`);

  const schema = fs
    .readFileSync('./src/helpers/schema.sql', 'utf8')
    .replaceAll('CREATE TABLE ', `CREATE TABLE ${dbName}.`)
    .split(splitToken)
    .filter(s => s.trim().length > 0);

  console.info(`- Importing the schema (${schema.length} tables)`);

  for (const statement of schema) {
    await db.queryAsync(`${statement}${splitToken}`);
  }

  console.info(`Setting the permissions`);
  await db.queryAsync(
    `ALTER USER '${config.user}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${config.password}';`
  );
  await db.queryAsync('FLUSH PRIVILEGES;');

  console.log('Setup complete!');
}

(async () => {
  try {
    await run();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
