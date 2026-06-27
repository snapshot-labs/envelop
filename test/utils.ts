import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { NewSubscriber, subscribers } from '../src/schema';

export function cleanupSubscribersDb(
  value: any,
  field: 'created' | 'email' = 'created'
) {
  return db.delete(subscribers).where(eq(subscribers[field], value));
}

export function randomTimestamp() {
  return Math.floor(+new Date() / 1e3 + Math.floor(Math.random() * 1000));
}

export function insertSubscribers(rows: NewSubscriber[]) {
  return db.insert(subscribers).values(rows);
}
