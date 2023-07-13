# Envelop [![codecov](https://codecov.io/gh/snapshot-labs/envelop/branch/main/graph/badge.svg?token=XUVZPR34ER)](https://codecov.io/gh/snapshot-labs/envelop)

Envelop is the service behind Snapshot mailing list .

This service is API only, and should be used together with [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) to handle all front-end related matters.

---

## Project setup

### Dependencies

This service depends on a couple of services:

- Node.js 16.x
- MySQL 5+
- Redis
- A [sendgrid](https://sendgrid.com/) account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```bash
yarn
```

### Configure

Make a copy of `.env.example` and rename it as `.env`. Then update the credentials in the file to the correct values for your local setup.

| Key                        | Description                                                                                          | Example                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `HOST`                     | Hostname of the current envelop instance                                                             | `http://localhost:3006`                    |
| `FRONT_HOST`               | Hostname of the envelop-ui instance                                                                  | `http://localhost:8080`                    |
| `HUB_URL`                  | Hostname of snapshot's hub service                                                                   | `https://hub.snapshot.org`                 |
| `SIDEKICK_URL`             | Hostname of the sidekick service                                                                     | `https://sh5.co`                           |
| `WALLET_PRIVATE_KEY`       | Private key of the wallet used to sign the emails                                                    | `0x...`                                    |
| `DATABASE_URL`             | URL of the MySQL database                                                                            | `mysql://root:root@localhost:3306/envelop` |
| `REDIS_URL`                | URL of the Redis database                                                                            | `redis://localhost:6379`                   |
| `SENDGRID_API_KEY`         | API key of the sendgrid account                                                                      | `SG.1234567890`                            |
| `WEBHOOK_AUTH_SECRET`      | Authentication header sent by snapshot's [webhook service](https://docs.snapshot.org/tools/webhooks) | `abc123`                                   |
| `SENTRY_DSN`               | Sentry DSN key                                                                                       | `https://public@sentry.example.com/1`      |
| `SENTRY_TRACE_SAMPLE_RATE` | Sentry trace sample rate, nunmber between 0 and 1                                                    | `0.1`                                      |

### Development

Start the service with

```bash
yarn dev
```

### Running tests and linters

All tests are run using their own .env (`test/.env.test`).

#### Setup

```
mysql -e 'CREATE DATABASE envelop_test;' -uroot -proot
mysql -uroot -proot envelop_test < src/helpers/schema.sql
mysql -uroot -proot -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';"
mysql -uroot -proot -e "FLUSH PRIVILEGES;"
```

#### Unit tests

```bash
yarn test:unit
```

#### End-to-end tests

```bash
yarn test:e2e
```

> You can run and generate the coverage for all tests at once with `yarn test`

#### Lint

```bash
yarn lint
yarn typecheck
```

Make sure to run the lints to ensure your code follow the coding standard before submitting any commits.
You can optionally run these tasks automatically on commit and on push by installing the git hooks with husky:

```bash
yarn husky install
```

## Usage

All the endpoints return a JSON response.

### `POST /`

This endpoint will trigger different action depending on the payload `method` param.

#### Subscribe to the mailing list

Subscribe an email and a wallet address to the mailing list

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{"method": "snapshot.subscribe", "params": { "email": "me@email.com", "address": "0xabc", "signature": "0x123" }}'
```

##### Success response example

```bash
{
   jsonrpc: '2.0',
   'OK',
   ''
 }
```

#### Verify the email

Email verification, triggered by the user via envelop-ui

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{"method": "snapshot.verify", "params": { "email": "me@email.com", "address": "0xabc", "salt": "1234", "signature": "0x123" }}'
```

##### Success response example

```bash
{
   jsonrpc: '2.0',
   'OK',
   ''
 }
```

#### Update subscriptions

Update an email's subscription

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{"method": "snapshot.update", "params": { "address": "0xabc", "subscriptions": ["summary"], "signature": "0x123" }}'
```

##### Success response example

```bash
{
   jsonrpc: '2.0',
   'OK',
   ''
 }
```

#### Unsubscribe

Unsubscribe an email from the database.

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{"method": "snapshot.unsubscribe", "params": { "email": "me@email.com", "address": "0xabc", "signature": "0x123" }}'
```

##### Success response example

```bash
{
   jsonrpc: '2.0',
   'OK',
   ''
 }
```

### `POST /subscriber`

Return a subscriber, given a wallet address

```bash
# Response signature
{
  status: 'VERIFIED' | 'UNVERIFIED' | 'NOT_SUBSCRIBED';
  subscriptions: templateId[]
}
```

#### Request example

```bash
curl -X POST localhost:3006/subscriber -H "Content-Type: application/json" -d '{"address": "0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3"}'
```

#### Request example

```json
{
  "status": "VERIFIED",
  "subscriptions": ["summary", "newProposal", "closedProposal"]
}
```

### `GET /subscriptionsList`

Return the list of all available subscription type

```bash
# Response signature
{
  [key: templateId]: {
    name: string;
    description: string;
  }
}
```

#### Request example

```bash
 curl localhost:3006/subscriptionsList
```

#### Response example

```json
{
  "summary": {
    "name": "Weekly digest",
    "description": "Get a weekly report detailing the activity in your followed spaces."
  },
  "newProposal": {
    "name": "Proposal creation",
    "description": "Get informed when a new proposal is submitted in your followed spaces."
  },
  "closedProposal": {
    "name": "Proposal closure",
    "description": "Get informed when a proposal is closed in your followed spaces."
  }
}
```

### `POST /webhook`

Receive and trigger emails from webhook events.  
Data payload should follow [Snapshot webhook](https://docs.snapshot.org/tools/webhooks) format.

> CLI tests scripts are provided (see below) for easier testing, instead of sending CURL command

## Errors

All endpoints will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response on error:

```bash
{
  "jsonrpc":"2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE
  },
  "id": ID
}
```

| Description                                                     | `CODE` | `MESSAGE`                                   |
| --------------------------------------------------------------- | ------ | ------------------------------------------- |
| Request contains invalid data                                   | 400    | INVALID_PARAMS                              |
| Verifying an address already attached to another verified email | 400    | ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL |
| Signature is not valid                                          | 401    | UNAUTHORIZED                                |
| Address/email/record does not exist                             | 404    | RECORD_NOT_FOUND                            |
| Server error                                                    | 500    | SERVER_ERROR                                |

Take advantage of the `MESSAGE` code to show meaningful error message to your end user.

## Sending test emails

As triggering emails involve a few tedious steps on the UI, a few CLI scripts are provided to trigger the email sending directly to a given email address.

### To send a `verify` (verification) test email

```bash
yarn ts-node scripts/send-verify.ts [EMAIL] [ADDRESS]
// E.g.
// yarn ts-node scripts/send-verify.ts test@snapshot.org 0xeF8305E140ac520225DAf050e2f71d5fBcC543e7
```

- `EMAIL`: your email address (not required to already exist in the database)
- `ADDRESS`: a wallet address (not required to already exist in the database)

### To send a `summary` test email

```bash
yarn ts-node scripts/send-summary.ts [EMAIL] [ADDRESSES] [SEND_DATE]
# E.g.
# yarn ts-node scripts/send-summary.ts test@snapshot.org 0x07ecdeD990C06Bb6756EC300844B3F91677338d0 2023-04-25
```

- `EMAIL`: your email address (not required to already exist in the database)
- `ADDRESSES`: one or more wallet addresses (separated by a comma)
- `SEND_DATE`: a `yyyy-mm-dd` formatted date, to emulate the date the email is sent (affects the summary report time window)

### To send a `newProposal` test email

```bash
yarn ts-node scripts/send-new-proposal.ts [EMAIL] [PROPOSAL-ID]
# E.g.
# yarn ts-node scripts/send-new-proposal.ts test@snapshot.org 0xeF8305E140ac520225DAf050e2f71d5fBcC543e7
```

- `EMAIL`: your email address (not required to already exist in the database)
- `PROPOSAL-id`: a proposal ID

### To send a `closedProposal` test email

```bash
yarn ts-node scripts/send-closed-proposal.ts [EMAIL] [PROPOSAL-ID]
# E.g.
# yarn ts-node scripts/send-closed-proposal.ts test@snapshot.org 0xeF8305E140ac520225DAf050e2f71d5fBcC543e7
```

- `EMAIL`: your email address (not required to already exist in the database)
- `PROPOSAL-id`: a proposal ID

### To trigger a `webhook` event

Emulate an incoming webhook event from snapshot's [webhook service](https://docs.snapshot.org/tools/webhooks) (require that the envelop instance to be started e.g. with `yarn dev`, else the emails will just be queued without being sent).

```bash
yarn ts-node scripts/trigger-webhook-proposal.ts [EVENT] [ID]
# E.g.
# yarn ts-node scripts/trigger-webhook.ts proposal/created proposal/0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6
```

- `EVENT`: webhook event name
- `ID`: webhook ID

See https://docs.snapshot.org/tools/webhooks for the list of available `event` type.

## Production

```bash
# Build the project
yarn build
# Start the service
yarn start
```

## Contributing

See [the contribution guideline](.github/CONTRIBUTING.md)

## License

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).

```

```
