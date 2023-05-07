import request from 'supertest';
import db from '../../src/helpers/mysql';
import { cleanupDb } from './utils';

describe('POST subscribe', () => {
  const email = 'test@snapshot.org';
  const address = '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3';
  const signature =
    '0xd90711eb649882896dd394b1fa646b83b67f120090f0689ff4df9e6ae23c72f839dec83085019225324821de193b45135288af904d970c388e7a848121b2cf1f1b';
  let subscriberData: Record<string, any>;

  beforeEach(async () => {
    await cleanupDb();
    subscriberData = {
      method: 'snapshot.subscribe',
      params: {
        email,
        address,
        signature
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.end();
  });

  it('adds the email and address in the database as not verified', async () => {
    const response = await request(process.env.HOST).post('/').send(subscriberData);
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ? and verified = 0 LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
  });

  it('returns a success code if the email already exists', async () => {
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, 0)',
      [+new Date() / 1e3, email, address]
    );
    const response = await request(process.env.HOST).post('/').send(subscriberData);
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ? and verified = 0 LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
  });

  it('returns an error code when the address is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.subscribe',
        params: {
          email: 'test@test.com',
          address: '0xDB'
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('returns an error code if the email is missing', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.subscribe',
        params: {
          address: '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e'
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('returns an error code if the address is missing', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.subscribe',
        params: {
          email: 'test@test.com'
        }
      });

    expect(response.statusCode).toBe(400);
  });
});
