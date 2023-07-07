import db from '../src/helpers/mysql';
import { cleanupDb } from './utils';

export default async () => {
  await cleanupDb();
  return db.endAsync();
};
