# Envelop

Envelop is the service sending the snapshot weekly report email to subscribers.

The API also handle adding and removing users from the subscription list.

This service is API only, and should be used together with [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) to handle all front-end related matters.

---

## Project setup

### Dependencies

This service depends on a couple of services:

- Node.js (>= 18)
- MySQL5+
- A [sendgrid](https://sendgrid.com/) account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```bash
yarn
```

### Configure

Make a copy of `.env.example` and rename it as `.env`. Then update the credentials in the file to the correct values for your local setup.

- `HOST`: hostname of the current envelop instance (eg: `http://localhost:3006`)
- `FRONT_HOST`: hostname of the envelop-ui instance (eg: `http://localhost:8080`)
- `WALLET_PRIVATE_KEY`: private key of the wallet used to sign the emails (eg: `0x...`)
- `DATABASE_URL`: URL of the MySQL database (eg: `mysql://root:root@localhost:3306/envelop`)
- `REDIS_URL`: URL of the Redis database (eg: `redis://localhost:6379`)
- `SENDGRID_API_KEY`: API key of the sendgrid account

### Development

Start the service with

```bash
yarn dev
```

### Running tests and linters

#### Unit tests

Unit tests does not depend on the database, and can safely be run locally with:

```bash
yarn test
```

#### End-to-end tests

End-to-end tests depends on the database, and should not be run on production, and only on a properly configured test environment, to prevent unintentional database wiping.
The tests does not rely on any mocking, and test the whole stack.

- Create a database named `envelop_test`, following the same schema as the live database
- run tests with:

```bash
yarn test:e2e
```

E2E tests rely on a different .env file: `test/.env.test`, edit its variables to suit your setup.

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
| Address / email does not exist                                  | 404    | RECORD_NOT_FOUND                            |
| Server error                                                    | 500    | SERVER_ERROR                                |

Take advantage of the `MESSAGE` code to show meaningful error message to your end user.

## Production

```bash
// Build the project
yarn build
// Start the app
yarn start
```

## Contributing

See [the contribution guideline](.github/CONTRIBUTING.md)

## Sending test emails

As triggering emails involve a few tedious steps on the UI, a few CLI scripts are provided to
trigger the email sending directly to a given email address.

### To send a `subscribe` (verification) test email

```bash
yarn ts-node scripts/send-subscribe.ts [EMAIL] [ADDRESS]
// E.g.
// yarn ts-node scripts/send-subscribe.ts test@snapshot.org 0xeF8305E140ac520225DAf050e2f71d5fBcC543e7
```

- `EMAIL`: your email address (not required to already exist in the database)
- `ADDRESS`: a wallet address (not required to already exist in the database)

### To send a `summary` test email

```bash
yarn ts-node scripts/send-summary.ts [EMAIL] [SEND_DATE]
// E.g.
// yarn ts-node scripts/send-summary.ts test@snapshot.org 2023-04-25
```

- `EMAIL`: your email address (needs to already exist and verified in the database, in order to fetch the related wallet addresses)
- `SEND_DATE`: a `yyyy-mm-dd` formatted date, to emulate the date the email is sent (affects the summary report time window)

## Licence

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).
