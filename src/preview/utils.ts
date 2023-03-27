import { createHash } from 'crypto';
import templates from '../templates';
import constants from '../helpers/constants.json';

export function sha256(token = ''): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function buildMessage(template: string): Promise<any> {
  const params: { to: string; address?: string; addresses?: string[]; signature?: string } = {
    to: constants.example.to
  };

  if (template === 'summary') {
    params.addresses = constants.example.addresses;
  } else {
    params.address = constants.example.addresses[0];
  }

  if (templates[template]) {
    return await templates[template].prepare(params);
  } else {
    return Promise.reject();
  }
}
