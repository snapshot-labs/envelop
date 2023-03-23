import { createHash } from 'crypto';

export function sha256(token = ''): string {
  return createHash('sha256').update(token).digest('hex');
}
