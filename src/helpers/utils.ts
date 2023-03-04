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

export async function unsubscribe(email: string, address: string) {
  return await db.queryAsync('DELETE FROM subscribers WHERE email = ? AND address = ? LIMIT 1', [
    email,
    address
  ]);
}
