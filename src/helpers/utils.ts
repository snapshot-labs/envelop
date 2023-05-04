import { Response } from 'express';
import db from './mysql';

export function rpcSuccess(res: Response, result: string, id: string | number) {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
}

export function rpcError(res: Response, code: number, e: unknown, id: string | number) {
  res.status(code).json({
    jsonrpc: '2.0',
    error: {
      code,
      message: 'unauthorized',
      data: e
    },
    id
  });
}

export async function subscribe(email: string, address: string) {
  const created = (Date.now() / 1e3).toFixed();
  const subscriber = { email, address, created };
  return await db.queryAsync('INSERT IGNORE INTO subscribers SET ?', [subscriber]);
}

export async function verify(email: string, address: string) {
  const verified = (Date.now() / 1e3).toFixed();
  return await db.queryAsync(
    'UPDATE subscribers SET verified = ? WHERE email = ? AND address = ? AND verified = ? LIMIT 1',
    [verified, email, address, 0]
  );
}

export async function unsubscribe(email: string) {
  return await db.queryAsync('DELETE FROM subscribers WHERE email = ?', [email]);
}

export async function getEmailAddresses(email: string): Promise<{ address: string }[]> {
  return await db.queryAsync('SELECT address FROM subscribers WHERE email = ? AND verified > 0', [
    email
  ]);
}

export async function getUniqueEmails(): Promise<{ email: string }[]> {
  return await db.queryAsync('SELECT DISTINCT email FROM subscribers WHERE verified > 0');
}

export function isValidEmail(input: string) {
  return new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, 'gm').test(input);
}

export function isValidAddress(input: string) {
  return new RegExp(/^0x[a-fA-F0-9]{40}$/, 'g').test(input);
}
