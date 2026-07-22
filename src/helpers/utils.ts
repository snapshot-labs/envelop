import { and, asc, desc, eq, gt, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { subscribers, type NewSubscriber } from '../schema';
import { SUBSCRIPTION_TYPE } from '../templates';
import type { Response } from 'express';

function currentTimestamp() {
  return Math.round(Date.now() / 1e3);
}

export const VERIFIED = 'VERIFIED';
export const UNVERIFIED = 'UNVERIFIED';
export const NOT_SUBSCRIBED = 'NOT_SUBSCRIBED';

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
  const subscriber: NewSubscriber = { email, address, created: currentTimestamp() };
  const insertedRows = await db
    .insert(subscribers)
    .values(subscriber)
    .onConflictDoNothing()
    .returning({ email: subscribers.email });

  if (insertedRows.length > 0) {
    return subscriber;
  }

  return null;
}

export async function verify(email: string, address: string, salt: string) {
  const existingVerifiedEmail = (
    await db.query.subscribers.findFirst({
      columns: { email: true },
      where: and(
        eq(subscribers.address, address),
        eq(subscribers.created, Number(salt)),
        gt(subscribers.verified, 0)
      )
    })
  )?.email;

  if (existingVerifiedEmail === email) {
    return true;
  } else if (!!existingVerifiedEmail) {
    throw new Error('ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL');
  }

  const updatedRows = await db
    .update(subscribers)
    .set({ verified: currentTimestamp() })
    .where(
      and(
        eq(subscribers.email, email),
        eq(subscribers.address, address),
        eq(subscribers.created, Number(salt)),
        eq(subscribers.verified, 0)
      )
    )
    .returning({ email: subscribers.email });

  if (updatedRows.length === 0) {
    throw new Error('RECORD_NOT_FOUND');
  }

  return true;
}

function subscriberFilters(email: string, address: string) {
  const conditions: SQL[] = [];
  if (email && email.length > 0) {
    conditions.push(eq(subscribers.email, email));
  }
  if (address && address.length > 0) {
    conditions.push(eq(subscribers.address, address));
  }

  if (conditions.length === 0) {
    throw new Error('INVALID_PARAMS');
  }

  return conditions;
}

export async function update(email: string, address: string, subscriptions: string[]) {
  const subs = sanitizeSubscriptions(subscriptions);

  return db
    .update(subscribers)
    .set({ subscriptions: subs })
    .where(and(...subscriberFilters(email, address), gt(subscribers.verified, 0)));
}

export async function unsubscribe(email: string, address: string) {
  return db.delete(subscribers).where(and(...subscriberFilters(email, address)));
}

export function subscribedTo(type: string) {
  return and(
    gt(subscribers.verified, 0),
    or(
      sql`${subscribers.subscriptions} @> ${JSON.stringify(type)}::jsonb`,
      isNull(subscribers.subscriptions)
    )
  );
}

export async function getVerifiedSubscriptions(subscription: string) {
  const sub = sanitizeSubscriptions(subscription)[0];

  if (!sub) {
    throw new Error('Invalid subscription type');
  }

  return db.query.subscribers.findMany({
    columns: { email: true, address: true, subscriptions: true },
    where: subscribedTo(sub),
    orderBy: asc(subscribers.created)
  });
}

export async function getSubscriber(address: string) {
  const subscriber = await db.query.subscribers.findFirst({
    columns: { email: true, verified: true, subscriptions: true },
    where: eq(subscribers.address, address),
    orderBy: [desc(subscribers.verified), desc(subscribers.created)]
  });

  if (!subscriber) {
    throw new Error('RECORD_NOT_FOUND');
  }

  return {
    status: subscriber.verified > 0 ? VERIFIED : UNVERIFIED,
    subscriptions: subscriber.subscriptions || SUBSCRIPTION_TYPE
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
