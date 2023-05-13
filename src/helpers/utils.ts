import db from './mysql';
import { SUBSCRIPTION_TYPE } from '../templates';
import type { Response } from 'express';
import { OkPacket } from 'mysql';
import { TemplateId } from '../../types';

function currentTimestamp() {
  return (Date.now() / 1e3).toFixed();
}

export function rpcSuccess(res: Response, result: string, id: string | number) {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
}

export function rpcError(res: Response, e: Error | string, id: string | number) {
  const message = e instanceof Error ? e.message : e;
  const ERROR_CODES: Record<string, number> = {
    INVALID_PARAMS: 400,
    ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL: 400,
    UNAUTHORIZED: 401,
    RECORD_NOT_FOUND: 404,
    SERVER_ERROR: 500
  };
  const statusCode = ERROR_CODES[message] || 500;

  res.status(statusCode).json({
    jsonrpc: '2.0',
    error: {
      code: statusCode,
      message,
      data: {}
    },
    id
  });
}

export function sanitizeSubscriptions(list?: string | string[]) {
  return (Array.isArray(list) ? list : [list]).filter((item: any) =>
    SUBSCRIPTION_TYPE.includes(item)
  ) as typeof SUBSCRIPTION_TYPE;
}

export async function subscribe(email: string, address: string) {
  const subscriber = { email, address, created: currentTimestamp() };
  return await db.queryAsync('INSERT IGNORE INTO subscribers SET ?', [subscriber]);
}

export async function verify(email: string, address: string) {
  const existingVerifiedEmail = (
    await db.queryAsync(
      `SELECT email FROM subscribers WHERE address = ? AND verified > 0 LIMIT 1`,
      [address]
    )
  )[0]?.email;

  if (existingVerifiedEmail === email) {
    return true;
  } else if (!!existingVerifiedEmail) {
    throw new Error('ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL');
  }

  const a = (await db.queryAsync(
    'UPDATE subscribers SET verified = ? WHERE email = ? AND address = ? AND verified = ? LIMIT 1',
    [currentTimestamp(), email, address, 0]
  )) as unknown as OkPacket;

  if (a.changedRows === 0) {
    throw new Error('RECORD_NOT_FOUND');
  }

  return true;
}

export async function update(email: string, address: string, subscriptions: string[]) {
  const subs = sanitizeSubscriptions(subscriptions);
  if (subs.length === 0) {
    return await db.queryAsync('DELETE FROM subscribers WHERE email = ? and address = ? LIMIT 1', [
      email,
      address
    ]);
  } else {
    return await db.queryAsync(
      'UPDATE subscribers SET subscriptions = ? WHERE email = ? AND address = ? LIMIT 1',
      [JSON.stringify(sanitizeSubscriptions(subscriptions)), email, address]
    );
  }
}

export async function unsubscribe(email: string, subscriptions?: string[]) {
  const subs = sanitizeSubscriptions(subscriptions);

  if (subs.length === 0) {
    return await db.queryAsync('DELETE FROM subscribers WHERE email = ?', [email]);
  } else {
    return await db.queryAsync('UPDATE subscribers SET subscriptions = ? WHERE email = ?', [
      JSON.stringify(subs),
      email
    ]);
  }
}

export async function getEmailAddresses(email: string) {
  return await db.queryAsync('SELECT address FROM subscribers WHERE email = ? AND verified > 0', [
    email
  ]);
}

export async function getUniqueEmails(subscriptionType: string) {
  const subscription = sanitizeSubscriptions(subscriptionType)[0];
  return await db.queryAsync(
    `SELECT DISTINCT email FROM subscribers WHERE verified > 0 AND ` +
      `(JSON_CONTAINS(subscriptions, '"${subscription}"') OR subscriptions IS NULL)`
  );
}

export async function getAddressSubscriptions(address: string): Promise<TemplateId[]> {
  const subscriptions = await db.queryAsync(
    'SELECT email, subscriptions from subscribers WHERE address = ? AND verified > 0 LIMIT 1',
    [address]
  );

  if (!subscriptions[0]) {
    throw new Error('RECORD_NOT_FOUND');
  }

  if (!subscriptions[0].subscriptions) {
    return SUBSCRIPTION_TYPE;
  }

  return JSON.parse(subscriptions[0].subscriptions as string);
}

// RFC5322 standard, does support most format, but not all
// See test files for list of tested formats
export function isValidEmail(input: string) {
  return new RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
    'gi'
  ).test(input);
}
