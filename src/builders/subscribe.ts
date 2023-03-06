import buildMail from './';

export default async function buildSubscribe(params: any): Promise<unknown> {
  return buildMail('subscribe', params);
}
