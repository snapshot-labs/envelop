import fetch from 'cross-fetch';
import db, { SqlRow } from './mysql';
import { SUBSCRIPTION_TYPE } from '../templates';
import type { Response } from 'express';
import type { OkPacket } from 'mysql';

type Subscriber = {
  email: string;
  address: string;
  created: number;
};

function currentTimestamp() {
  return Math.round(Date.now() / 1e3);
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
  const subscriber: Subscriber = { email, address, created: currentTimestamp() };
  const insertResponse = (await db.queryAsync('INSERT IGNORE INTO subscribers SET ?', [
    subscriber
  ])) as unknown as OkPacket;

  if (insertResponse.affectedRows > 0) {
    return subscriber;
  }

  return null;
}

export async function verify(email: string, address: string, salt: string) {
  const existingVerifiedEmail = (
    await db.queryAsync(
      `SELECT email FROM subscribers WHERE address = ? AND created = ? AND verified > 0 LIMIT 1`,
      [address, salt]
    )
  )[0]?.email;

  if (existingVerifiedEmail === email) {
    return true;
  } else if (!!existingVerifiedEmail) {
    throw new Error('ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL');
  }

  const updateResult = (await db.queryAsync(
    'UPDATE subscribers SET verified = ? WHERE email = ? AND address = ? AND created = ? AND verified = ? LIMIT 1',
    [currentTimestamp(), email, address, salt, 0]
  )) as unknown as OkPacket;

  if (updateResult.changedRows === 0) {
    throw new Error('RECORD_NOT_FOUND');
  }

  return true;
}

export async function update(email: string, address: string, subscriptions: string[]) {
  const fields: Record<string, string> = {};
  if (email && email.length > 0) {
    fields['email = ?'] = email;
  }
  if (address && address.length > 0) {
    fields['address = ?'] = address;
  }

  if (Object.keys(fields).length === 0) {
    throw new Error('INVALID_PARAMS');
  }

  const subs = sanitizeSubscriptions(subscriptions);
  const whereQueryChunk = Object.keys(fields).join(' AND ');
  const stringifiedSubs = JSON.stringify(subs);

  return db.queryAsync(
    `UPDATE subscribers SET subscriptions = ? WHERE ${whereQueryChunk} AND verified > 0`,
    [stringifiedSubs, ...Object.values(fields)]
  );
}

export async function unsubscribe(email: string, address: string) {
  const fields: Record<string, string> = {};
  if (email && email.length > 0) {
    fields['email = ?'] = email;
  }
  if (address && address.length > 0) {
    fields['address = ?'] = address;
  }

  if (Object.keys(fields).length === 0) {
    throw new Error('INVALID_PARAMS');
  }

  return await db.queryAsync(
    `DELETE FROM subscribers WHERE ${Object.keys(fields).join(' AND ')}`,
    Object.values(fields)
  );
}

export async function getVerifiedSubscriptions(subscription: string, batchSize = 1000) {
  let page = 0;
  let results: SqlRow[] = [];
  const sub = sanitizeSubscriptions(subscription)[0];

  if (!sub) {
    throw new Error('Invalid subscription type');
  }

  while (true) {
    const result = await db.queryAsync(
      'SELECT email, address, subscriptions FROM subscribers WHERE verified > 0 ' +
        `AND JSON_CONTAINS(subscriptions, ?) OR subscriptions IS NULL ORDER BY created LIMIT ? OFFSET ?`,
      [JSON.stringify(sub), batchSize, page * batchSize]
    );

    if (result.length === 0) {
      break;
    }

    page += 1;
    results = results.concat(result);
  }

  return results;
}

export async function getSubscriber(address: string) {
  const subscriber = (
    await db.queryAsync(
      'SELECT email, verified, subscriptions from subscribers WHERE address = ? ORDER BY created DESC, verified DESC LIMIT 1',
      [address]
    )
  )[0];

  if (!subscriber) {
    throw new Error('RECORD_NOT_FOUND');
  }

  return {
    status: (subscriber.verified as number) > 0 ? 'VERIFIED' : 'UNVERIFIED',
    email: subscriber.email as string,
    subscriptions: !subscriber.subscriptions
      ? SUBSCRIPTION_TYPE
      : JSON.parse(subscriber.subscriptions as string)
  };
}

// RFC5322 standard, does support most format, but not all
// See test files for list of tested formats
export function isValidEmail(input: string) {
  return new RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
    'gi'
  ).test(input);
}

export async function getModerationList() {
  const response = await fetch(`${process.env.SIDEKICK_URL || 'https://sh5.co'}/api/moderation`);

  return response.json();
}

export function obfuscateEmail(email: string) {
  return email.replace(/([\w\._\-+]{2})(.+)@([\w.]+\w)/, (_, a, b, c) => {
    return `${a}${'*'.repeat(b.length)}@${c}`;
  });
}
