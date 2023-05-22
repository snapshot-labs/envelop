import { signVerify } from '../../sign';
import buildMessage from '../builder';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const verifyLink = `${process.env.FRONT_HOST}/#/verify?${new URLSearchParams({
    signature: await signVerify(params.to, params.address),
    email: params.to,
    address: params.address
  }).toString()}`;

  return buildMessage('subscribe', { ...params, verifyLink });
}
