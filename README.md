# Envelop [![codecov](https://codecov.io/gh/snapshot-labs/envelop/branch/main/graph/badge.svg?token=XUVZPR34ER)](https://codecov.io/gh/snapshot-labs/envelop)

Envelop is the service behind the Snapshot mailing list.

It keeps the list of subscribers, authenticates every change to it with an
EIP-712 signature from the subscriber's own wallet, and sends the mails —
address verification, new/closed proposal notifications and a weekly digest —
through SendGrid, using Redis-backed queues.

This service is API only, and should be used together with
[Envelop-UI](https://github.com/snapshot-labs/envelop-ui) to handle all
front-end related matters.

---

## How it works

**Subscribing.** A user signs a `Subscribe` message in envelop-ui and posts it
to `POST /`. Envelop stores the row as unverified and queues a verification
mail containing a link back to envelop-ui, signed by envelop's own wallet. The
user opens the link, envelop-ui posts it back as `snapshot.verify`, and the row
becomes verified. Only verified subscribers ever receive a notification.

**Proposal mails.** Snapshot's [webhook service](https://docs.snapshot.box/tools/webhooks)
posts `proposal/created` and `proposal/end` events to `POST /webhook`. Envelop
looks the proposal up on the hub, drops it if the proposal or its space is
flagged or the space is unverified, resolves which subscribers follow that
space, and queues one mail per recipient.

New proposal mails are held back for up to two hours so they do not fire the
instant a proposal appears. Subscriptions keep changing during that wait, so
what gets delayed is the recipient lookup itself, not the individual mails —
the list is resolved when the mail is due.

**Weekly digest.** A repeating job runs every Monday at 01:00
`America/Anchorage` and queues one summary mail per subscribed email address,
covering the previous week.

```
POST /            ──▶ subscribers table ──▶ mailer queue ──▶ SendGrid
POST /webhook     ──▶ proposal-activities queue ──┘
Monday 01:00      ──▶ scheduler queue ────────────┘
```

All three queues are [Bull](https://github.com/OptimalBits/bull) queues on
Redis. Each job gets 3 attempts with exponential backoff, and a failure is only
reported to Sentry once the last one is used up.

---

## Project setup

### Dependencies

This service depends on a couple of services:

- Node.js 22.6+
- PostgreSQL 14+
- Redis
- A [sendgrid](https://sendgrid.com/) account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```bash
yarn
```

### Configure

Make a copy of `.env.example` and rename it as `.env`. Then update the
credentials in the file to the correct values for your local setup.

| Key                        | Required | Description                                                                                          | Example                                               |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`             | yes      | URL of the PostgreSQL database                                                                       | `postgres://postgres:postgres@localhost:5432/envelop` |
| `WALLET_PRIVATE_KEY`       | yes      | Private key of the wallet used to sign the emails                                                    | `0x...`                                               |
| `HOST`                     | to send  | Hostname of the current envelop instance, used for the image URLs in the mails                       | `http://localhost:3006`                               |
| `FRONT_HOST`               | to send  | Hostname of the envelop-ui instance, used for the verify/update/unsubscribe links in the mails       | `http://localhost:8080`                               |
| `SENDGRID_API_KEY`         | to send  | API key of the sendgrid account                                                                      | `SG.1234567890`                                       |
| `WEBHOOK_AUTH_TOKEN`       | to send  | Expected value of the `authentication` header on `POST /webhook`                                     | `abc123`                                              |
| `REDIS_URL`                | no       | URL of the Redis database, defaults to `redis://127.0.0.1:6379`                                      | `redis://localhost:6379`                              |
| `HUB_URL`                  | no       | Hostname of snapshot's hub service, defaults to `https://hub.snapshot.org`                           | `https://hub.snapshot.org`                            |
| `PORT`                     | no       | Port the service listens on, defaults to `3006`                                                      | `3006`                                                |
| `COMMIT_HASH`              | no       | Commit the instance runs, appended to the version returned by `GET /`                                | `a1b2c3d`                                             |
| `METRICS_AUTHORIZATION`    | no       | Bearer token required on `GET /metrics`. Unset leaves the endpoint open                              | `abc123`                                              |
| `SENTRY_DSN`               | no       | Sentry DSN key                                                                                       | `https://public@sentry.example.com/1`                 |
| `SENTRY_TRACE_SAMPLE_RATE` | no       | Sentry trace sample rate, number between 0 and 1                                                     | `0.1`                                                 |

### Database

Create the database named in `DATABASE_URL`:

```bash
createdb envelop
```

The app applies its own migrations at startup, so the database only needs to
exist. After each schema change (`src/schema.ts`), run `yarn db:generate` to
generate the matching migration.

### Development

Start the service with

```bash
yarn dev
```

### Running tests and linters

All tests are run using their own .env (`test/.env.test`), which is committed —
no extra configuration needed.

#### Setup

Create an empty test database (its name must end with `_test`):

```bash
createdb envelop_test
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

---

## Signing requests

Every method on `POST /` is authenticated by an
[EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed-data signature. There is
no session and no API key: the signature is the credential, and an invalid one
is answered with `UNAUTHORIZED`.

The domain is the same for all messages, and has no `chainId` or
`verifyingContract`:

```json
{ "name": "snapshot", "version": "0.1.4" }
```

The message types are defined in `src/sign/types.ts`:

| Method                 | Type            | Fields                                     | Signed by                    |
| ---------------------- | --------------- | ------------------------------------------ | ---------------------------- |
| `snapshot.subscribe`   | `Subscribe`     | `address`, `email`                          | the subscriber               |
| `snapshot.verify`      | `Verify`        | `address`, `email`, `salt`                  | envelop (`WALLET_PRIVATE_KEY`) |
| `snapshot.update`      | `Subscriptions` | `address`, `email`, `subscriptions`         | the subscriber, or envelop   |
| `snapshot.unsubscribe` | `Unsubscribe`   | `address`, `email`                          | the subscriber, or envelop   |

`address` must be checksummed, and is recovered from the signature — a mismatch
is what makes the request unauthorized.

`snapshot.update` and `snapshot.unsubscribe` accept two kinds of signature. Sent
with an `address`, the signature must come from that address. Sent with an empty
`address`, it must come from envelop's own wallet: this is how the
one-click unsubscribe and manage-subscriptions links inside the mails work,
since the recipient has no wallet at hand when clicking them.

A backend-signed `snapshot.update` also signs a different payload from the request
body: the signed `subscriptions` must be `[]`, not the array being saved. So
envelop signs `{ address: <envelop wallet>, email, subscriptions: [] }` while the
request still carries the real `subscriptions` to persist.

`snapshot.verify` is always signed by envelop, never by the user. Its `salt` is
the subscriber's creation timestamp. Both are handed to envelop-ui in the
verification link, so there is nothing to produce by hand.

Producing a signature with [ethers](https://docs.ethers.org) v5:

```ts
import { Wallet } from '@ethersproject/wallet';

// Hardhat's well-known test account 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
const wallet = new Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);

const domain = { name: 'snapshot', version: '0.1.4' };
const types = {
  Subscribe: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};

const signature = await wallet._signTypedData(domain, types, {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  email: 'test@snapshot.org'
});
```

On ethers v6 the method is named `signer.signTypedData()`.

---

## Usage

All the endpoints return a JSON response.

The examples below run against a local instance on port 3006, and are signed
with Hardhat's well-known test account
`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` — copy them as-is and they work.
The one exception is `snapshot.verify`, whose signature depends on the
instance's own `WALLET_PRIVATE_KEY`.

`POST /` follows the [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
response envelope. The optional `id` of the request is echoed back untouched;
omit it and it is left out of the response.

### `POST /`

This endpoint will trigger different action depending on the payload `method` param.

#### Subscribe to the mailing list

Subscribe an email and a wallet address to the mailing list. The address is
stored as unverified, and a verification mail is queued.

| Param       | Description                                |
| ----------- | ------------------------------------------ |
| `email`     | Email address to subscribe                 |
| `address`   | Checksummed wallet address of the subscriber |
| `signature` | `Subscribe` signature, from `address`      |

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{
  "id": "1",
  "method": "snapshot.subscribe",
  "params": {
    "email": "test@snapshot.org",
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "signature": "0x5f3cd08a8d4c859751704bdc98ea86e8352e79e27d2f5ee5426381b94692cf9323aa324f544b7af9df1c45059df5a04b84e95f37a19003bfed8718198c8215dd1c"
  }
}'
```

##### Success response example

```json
{ "jsonrpc": "2.0", "result": "OK", "id": "1" }
```

Subscribing the same email and address pair again is a no-op — it answers `OK`
without queueing a second verification mail. The same address with a *different*
email is a new subscription, not a no-op.

#### Verify the email

Email verification, triggered by the user via envelop-ui. Both `salt` and
`signature` come from the verification link, and are produced by envelop.

| Param       | Description                                    |
| ----------- | ---------------------------------------------- |
| `email`     | Email address being verified                   |
| `address`   | Checksummed wallet address of the subscriber   |
| `salt`      | Subscriber creation timestamp, from the link   |
| `signature` | `Verify` signature, from envelop's own wallet  |

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{
  "id": "1",
  "method": "snapshot.verify",
  "params": {
    "email": "test@snapshot.org",
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "salt": "1789220292",
    "signature": "0x..."
  }
}'
```

##### Success response example

```json
{ "jsonrpc": "2.0", "result": "OK", "id": "1" }
```

Verifying an address that is already verified with a *different* email answers
`ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL`; one address can only ever be
verified with one email.

#### Update subscriptions

Update an email's subscriptions. Only verified subscribers can be updated, and
only the keys listed by `GET /subscriptionsList` are kept — anything else in
the array is dropped silently.

| Param           | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `email`         | Email address to update                                           |
| `address`       | Checksummed wallet address, or `""` for a backend-signed request   |
| `subscriptions` | Array of subscription keys to keep                                |
| `signature`     | `Subscriptions` signature                                         |

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{
  "id": "1",
  "method": "snapshot.update",
  "params": {
    "email": "test@snapshot.org",
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "subscriptions": ["summary", "newProposal"],
    "signature": "0xfa809e52470b7aab35f9e0204ce2c9e5a701c0d5dd6c469a480d7dc0a30094d52490433aab6d2d8e61c72e4b2dab0a18d11750950533151187833a7a0f5d97ae1b"
  }
}'
```

##### Success response example

```json
{ "jsonrpc": "2.0", "result": "OK", "id": "1" }
```

A `subscriptions` that is not an array is answered with `INVALID_PARAMS`.

#### Unsubscribe

Delete the subscriber from the database. Sent without an `address`, it removes
every address attached to that email — this is what the unsubscribe link in the
mails does.

| Param       | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| `email`     | Email address to remove                                         |
| `address`   | Checksummed wallet address, or `""` for a backend-signed request |
| `signature` | `Unsubscribe` signature                                         |

##### Request example

```bash
curl -X POST localhost:3006/ -H "Content-Type: application/json" -d '{
  "id": "1",
  "method": "snapshot.unsubscribe",
  "params": {
    "email": "test@snapshot.org",
    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "signature": "0xbc0b64305c7fe483d2fb019485dc287616810dc4a9a145af9dcfb3e61501adac34f64192e8822be2f66481ff501d6281ec3b7403676eabb1ea8f7aeb297890081b"
  }
}'
```

##### Success response example

```json
{ "jsonrpc": "2.0", "result": "OK", "id": "1" }
```

Unsubscribing an address that is not in the list is a no-op, and still answers
`OK`.

### `POST /subscriber`

Return a subscriber, given a wallet address. Unlike `POST /`, this endpoint
needs no signature and returns a bare object rather than a JSON-RPC envelope.

| Param     | Description                  |
| --------- | ---------------------------- |
| `address` | Wallet address to look up    |

```ts
// Response signature
{
  status: 'VERIFIED' | 'UNVERIFIED' | 'NOT_SUBSCRIBED';
  subscriptions?: templateId[];
}
```

An address that was never subscribed is not an error: it answers `200` with
`NOT_SUBSCRIBED` and no `subscriptions` key. A subscriber who never changed
their subscriptions is opted into all of them.

#### Request example

```bash
curl -X POST localhost:3006/subscriber -H "Content-Type: application/json" \
  -d '{"address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

#### Response example

```json
{
  "status": "VERIFIED",
  "subscriptions": ["summary", "newProposal", "closedProposal"]
}
```

#### Response example, unknown address

```json
{ "status": "NOT_SUBSCRIBED" }
```

### `GET /subscriptionsList`

Return the list of all available subscription type. These keys are what
`snapshot.update` accepts and what `POST /subscriber` returns.

```ts
// Response signature
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

Receive and trigger emails from webhook events. Data payload should follow
[Snapshot webhook](https://docs.snapshot.box/tools/webhooks) format.

The request must carry an `authentication` header matching `WEBHOOK_AUTH_TOKEN`,
otherwise it is answered with `UNAUTHORIZED`.

Only `proposal/created` and `proposal/end` queue anything. Any other event is
accepted and ignored, so the webhook service is not left retrying events this
service has no use for.

| Param   | Description                                                |
| ------- | ---------------------------------------------------------- |
| `event` | Webhook event name, e.g. `proposal/created`                |
| `id`    | Webhook ID, e.g. `proposal/0x8858...`                      |

The `proposal/` prefix is stripped from `id` before it is echoed back.

#### Request example

```bash
curl -X POST localhost:3006/webhook \
  -H "Content-Type: application/json" \
  -H "authentication: $WEBHOOK_AUTH_TOKEN" \
  -d '{
    "event": "proposal/created",
    "id": "proposal/0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6"
  }'
```

#### Success response example

```json
{
  "jsonrpc": "2.0",
  "result": "OK",
  "id": "0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6"
}
```

#### Response example, event with nothing to do

```json
{
  "jsonrpc": "2.0",
  "result": "Event skipped",
  "id": "0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6"
}
```

> CLI tests scripts are provided (see below) for easier testing, instead of sending CURL command

### Internal endpoints

Not part of the public API — they exist for operations and for working on the
mail templates.

#### `GET /`

Health check. Returns the service name and version, with the short commit
appended when `COMMIT_HASH` is set.

```bash
curl localhost:3006/
```

```json
{ "name": "envelop", "version": "0.1.0" }
```

#### `GET /preview/:template`

Render a mail template as HTML in the browser, with example data — the fastest
way to work on a template without sending anything. `:template` is `summary`,
`newProposal` or `closedProposal`.

| Query param | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `id`        | Proposal ID, or a wallet address for `summary`                       |
| `sendDate`  | `yyyy-mm-dd`, emulates the date the mail is sent (`summary` only)     |

```bash
curl "localhost:3006/preview/newProposal?id=0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6"
```

Returns the rendered HTML. An unknown `:template` answers `RECORD_NOT_FOUND`; a
proposal that does not exist, or one that is flagged or in a flagged/unverified
space, answers `200` with the plain text `No preview available`. `verification`
cannot be previewed: it needs a salt the preview does not supply, and answers
`RECORD_NOT_FOUND`.

#### `GET /send/:template`

Actually send a template, for a smoke test against a real inbox. Gated by a
shared token — a fixed value whose hash lives in `src/preview/send.ts`, not an
environment variable — and it sends real mail.

| Query param | Description                                             |
| ----------- | ------------------------------------------------------- |
| `token`     | Shared secret, required                                 |
| `to`        | Recipient, defaults to the address in `constants.json`  |

`summary` is a special case: instead of sending one mail it queues the weekly
digest run for every subscriber, exactly as the Monday cron does.

```bash
curl "localhost:3006/send/newProposal?token=$TOKEN&to=test@snapshot.org"
```

```json
{ "jsonrpc": "2.0", "result": "OK", "id": "newProposal" }
```

`204` as the result means the template produced nothing to send.

#### `GET /metrics`

Prometheus metrics, including the default Node and HTTP ones plus:

| Metric                                 | Description                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `subscribers_per_status_count`         | Subscribers per `VERIFIED` / `UNVERIFIED` status      |
| `subscribers_per_subscription_count`   | Subscribers per subscription type                     |
| `mailing_queued_jobs_count`            | Mails queued, pending sending                         |
| `mailing_pending_fanout_count`         | Proposal fan-out jobs pending recipient resolution     |
| `mailing_sent_count`                   | Sent mails, per type                                  |
| `mailing_skipped_count`                | Mail jobs skipped without sending, per type           |

Requires `Authorization: Bearer $METRICS_AUTHORIZATION` when that variable is
set; the endpoint is open when it is not.

```bash
curl -H "Authorization: Bearer $METRICS_AUTHORIZATION" localhost:3006/metrics
```

## Errors

All API endpoints will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response on error:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": 401,
    "message": "UNAUTHORIZED",
    "data": {}
  },
  "id": "1"
}
```

The HTTP status code matches `code`.

| Description                                                     | `CODE` | `MESSAGE`                                   |
| --------------------------------------------------------------- | ------ | ------------------------------------------- |
| Request contains invalid data                                   | 400    | INVALID_PARAMS                              |
| Verifying an address already attached to another verified email | 400    | ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL |
| Signature is not valid                                          | 401    | UNAUTHORIZED                                |
| Address/email/record does not exist, or unknown route           | 404    | RECORD_NOT_FOUND                            |
| Unexpected server error                                         | 500    | (the underlying error message)              |

Take advantage of the `MESSAGE` code to show meaningful error message to your end user.

## Sending test emails

As triggering emails involve a few tedious steps on the UI, a few CLI scripts
are provided to trigger the email sending directly to a given email address.
They call the queue processors directly, so the service does not need to be
running — but they do send real mail through SendGrid.

### To send a `verify` (verification) test email

```bash
yarn ts-node scripts/send-verification.ts [EMAIL] [ADDRESS] [SALT]
# E.g.
# yarn ts-node scripts/send-verification.ts test@snapshot.org 0xeF8305E140ac520225DAf050e2f71d5fBcC543e7 1689000000
```

- `EMAIL`: your email address (not required to already exist in the database)
- `ADDRESS`: a wallet address (not required to already exist in the database)
- `SALT`: any value, used as the salt in the verification link

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
# yarn ts-node scripts/send-new-proposal.ts test@snapshot.org 0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6
```

- `EMAIL`: your email address (not required to already exist in the database)
- `PROPOSAL-ID`: a proposal ID

### To send a `closedProposal` test email

```bash
yarn ts-node scripts/send-closed-proposal.ts [EMAIL] [PROPOSAL-ID]
# E.g.
# yarn ts-node scripts/send-closed-proposal.ts test@snapshot.org 0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6
```

- `EMAIL`: your email address (not required to already exist in the database)
- `PROPOSAL-ID`: a proposal ID

Both proposal scripts exit `1` without sending when the proposal does not exist,
is flagged, or belongs to a flagged or unverified space — the same rule the
webhook applies.

### To trigger a `webhook` event

Emulate an incoming webhook event from snapshot's [webhook service](https://docs.snapshot.box/tools/webhooks). This one only queues jobs, so the service must be running (e.g. with `yarn dev`) for the mails to actually leave.

```bash
yarn ts-node scripts/trigger-webhook.ts [EVENT] [ID]
# E.g.
# yarn ts-node scripts/trigger-webhook.ts proposal/created proposal/0x88583c43b196ec86cee45345611b582108f1d6933ab688a7cae992a6baa552a6
```

- `EVENT`: webhook event name
- `ID`: webhook ID

It prints how many mail jobs it queued, or reports that the fan-out was
scheduled for later when the proposal mail is not due yet.

See [Snapshot webhooks documentation](https://docs.snapshot.box/tools/webhooks) for the list of available `event` type.

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
