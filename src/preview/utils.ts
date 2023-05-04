import { createHash } from 'crypto';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { TemplatePrepareParams, TemplateId } from '../../types';

export function sha256(token = ''): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function buildMessage(
  templateId: TemplateId,
  customParams: TemplatePrepareParams = {}
): Promise<any> {
  const params: {
    to: string;
    address?: string;
    addresses?: string[];
    signature?: string;
    endDate?: Date;
  } = {
    to: constants.example.to
  };

  if (templateId === 'summary') {
    params.addresses = constants.example.addresses;
    params.endDate = new Date();
  } else {
    params.address = constants.example.addresses[0];
  }

  if (templates[templateId]) {
    return await templates[templateId].prepare({ ...params, ...customParams });
  } else {
    return Promise.reject();
  }
}
