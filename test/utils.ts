import db, { config } from '../src/helpers/mysql';

export function cleanupSubscribersDb(value: any, field = 'created') {
  const path = config.path;

  if (path) {
    return db.queryAsync(`DELETE FROM ${path[0]}.subscribers where ${field} = ?`, value);
  }
}

export function randomTimestamp() {
  return Math.floor(+new Date() / 1e3 + Math.floor(Math.random() * 1000));
}

export function insertSubscribers(subscribers: any[]) {
  return Promise.all(
    subscribers.map(data => {
      return db.queryAsync(
        'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
        data
      );
    })
  );
}
