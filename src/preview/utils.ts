import { createHash } from 'crypto';
import templates from '../templates';
import constants from '../helpers/constants.json';

export function sha256(token = ''): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function buildMessage(template: string, customParams = {}): Promise<any> {
  const params: {
    to: string;
    address?: string;
    addresses?: string[];
    signature?: string;
    endDate?: Date;
    startDate?: Date;
  } = {
    to: constants.example.to
  };

  if (template === 'summary') {
    params.addresses = constants.example.addresses;
    params.endDate = new Date();
    params.startDate = new Date(
      new Date(params.endDate).setDate(
        params.endDate.getDate() - constants.summary.days_time_window
      )
    );
  } else {
    params.address = constants.example.addresses[0];
  }

  if (templates[template]) {
    return await templates[template].prepare({ ...params, ...customParams });
  } else {
    return Promise.reject();
  }
}
