import { createHash } from 'crypto';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { previousWeek } from '../helpers/date';
import type { TemplatePrepareParams, TemplateId } from '../../types';

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
    startDate?: Date;
  } = {
    to: constants.example.to
  };

  if (templateId === 'summary') {
    params.addresses = [customParams.id] || constants.example.addresses;

    const summaryTimeRange = previousWeek(
      customParams.sendDate || new Date(),
      constants.summary.timezone
    );
    params.endDate = summaryTimeRange.end.toDate();
    params.startDate = summaryTimeRange.start.toDate();
  } else {
    params.address = constants.example.addresses[0];
  }

  if (templates[templateId]) {
    return await templates[templateId].prepare({ ...params, ...customParams });
  } else {
    return Promise.reject();
  }
}
