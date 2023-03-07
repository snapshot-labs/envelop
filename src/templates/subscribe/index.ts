import buildMessage from '../builder';

export default async function prepare(params: any): Promise<unknown> {
  return buildMessage('subscribe', { ...params });
}
