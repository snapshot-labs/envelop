import db from './mysql';

export function rpcSuccess(res, result, id) {
  res.json({
    jsonrpc: '2.0',
    result,
    id
  });
}

export function rpcError(res, code, e, id) {
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

export async function getEmailAddresses(email: string) {
  return await db.queryAsync('SELECT address FROM subscribers WHERE email = ?', [email]);
}

export async function getUniqueEmails() {
  return await db.queryAsync('SELECT DISTINCT email FROM subscribers');
}
