import { subscribe as signSubscribe } from '../../sign';
import buildMessage from '../builder';

export default async function prepare(params: any): Promise<unknown> {
  const verifyLink = `${process.env.FRONT_HOST}/verify?${new URLSearchParams({
    signature: await signSubscribe(params.to, params.address),
    email: params.to,
    address: params.address
  }).toString()}`;

  return buildMessage('subscribe', { ...params, verifyLink });
}
