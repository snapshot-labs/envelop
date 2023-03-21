import crypto from 'crypto';

export function authenticateToken(token = ''): boolean {
  const data = crypto.createHmac('sha256', process.env.SEND_SECRET as string).update(token);

  return data.digest('hex') === process.env.SEND_HASH;
}
