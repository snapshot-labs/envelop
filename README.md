# Envelop

Envelop is the service sending the snapshot weekly report email to subscribers.

The API also handle adding and removing users from the subscription list.

This service is API only, and should be used together with [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) to handle all front-end related matters.

---

## Project setup

### Dependencies

This API depends on a couple of services:

- Node.js (>= 18)
- MySQL@5+
- A sendgrid account (email provider)
- An [Envelop-UI](https://github.com/snapshot-labs/envelop-ui) instance

### Install

```bash
yarn
```

### Configure

Next, make a copy of `.env.example` and rename it as `.env`. Then update the credentials in the file to the correct values for your local setup.

- `HOST`: hostname of the current envelop instance (eg: `http://localhost:3000`)
- `FRONT_HOST`: hostname of the envelop-ui instance (eg: `http://localhost:8080`)

## Development

Start the app with

```bash
yarn dev
```

This will start the app on port 3000.

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

## Production

```bash
// Build the project
yarn build
// Start the app
yarn start
```

## Contributing

See [the contribution guideline](.github/CONTRIBUTING.md)

## Licence

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).
