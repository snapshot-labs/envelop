import db from '../src/helpers/mysql';

export function cleanupDb() {
  return db.queryAsync('DELETE FROM envelop_test.subscribers;');
}

export function cleanupSubscribersDb(value: any, field = 'created') {
  return db.queryAsync(`DELETE FROM envelop_test.subscribers where ${field} = ?`, value);
}

export function randomTimestamp() {
  return Math.floor(+new Date() / 1e3 + Math.floor(Math.random() * 1000));
}
