import { isAddress } from '@ethersproject/address';
import db from './mysql';
import type { Response } from 'express';

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

// RFC5322 standard, does support most format, but not all
// See test files for list of tested formats
export function isValidEmail(input: string) {
  return new RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
    'gi'
  ).test(input);
}

export function isValidAddress(input: string) {
  return isAddress(input);
}
