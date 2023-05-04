import db from '../../src/helpers/mysql';

export function cleanupDb() {
  return db.queryAsync('DELETE FROM envelop_test.subscribers;');
}
