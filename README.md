# Envelop

Envelop is the service sending the snapshot weekly report email to subscribers.

The API also handle adding and removing users from the subscription list.

This service is API only, and should be used together with [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) to handle all front-end related matters.

---

## Project setup

### Dependencies

This API depends on a couple of services:

- Node.js (>= 18)
- MySQL
- A sendgrid account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```
yarn
```

### Configure

Next, make a copy of `.env.example` and rename it as `.env`. Then update the credentials in the file to the correct values for your local setup.

- `HOST`: hostname of the current envelop instance (eg: `http://localhost:3000`)
- `FRONT_HOST`: hostname of the envelop-ui instance (eg: `http://localhost:8080`)

### Start

Finally, start the service with

```
yarn dev
```

This should start the service to be listening on port 3000.

## Running tests

### Unit tests

Unit test does not depends on the database, and can safely run locally with:

```
yarn test
```

### End-to-end tests

End-to-end tests depends on a database, and should not be run on production, but only on a properly configured test environment, to prevent unintentional database wiping.
The tests does not rely on any mocking, and tests the whole stack.

- Create a database named `envelop_test`, with the same schema as the live database
- Install dotenv-cli with `yarn global add dotenv-cli`
- start the app with `dotenv -e test/.env.test yarn dev`
- run tests with:

```
yarn test:e2e
```

E2E tests rely on a another .env file: `test/.env.test`, edit its variables to suit your setup.

## Licence

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).
