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
- A sendgrid account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```bash
yarn
```

### Configure

Make a copy of `.env.example` and rename it as `.env`. Then update the credentials in the file to the correct values for your local setup.

- `HOST`: hostname of the current envelop instance (eg: `http://localhost:3000`)
- `FRONT_HOST`: hostname of the envelop-ui instance (eg: `http://localhost:8080`)

### Development

Start the service with

```bash
yarn dev
```

## Running tests

### Unit tests

Unit test does not depends on the database, and can safely run locally with:

```bash
yarn test
```

### End-to-end tests

End-to-end tests depends on a database, and should not be run on production, but only on a properly configured test environment, to prevent unintentional database wiping.
The tests does not rely on any mocking, and tests the whole stack.

- Create a database named `envelop_test`, with the same schema as the live database
- Install dotenv-cli with `yarn global add dotenv-cli`
- start the app with `dotenv -e test/.env.test yarn dev`
- run tests with:

```bash
yarn test:e2e
```

E2E tests rely on a another .env file: `test/.env.test`, edit its variables to suit your setup.

This will run all tests

## Sending test emails

As triggering emails involve a few fastidious steps on the UI, a few CLI scripts are provided to
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

## Production

```bash
// Build the project
yarn build
// Start the service
yarn start
```

## Licence

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).
