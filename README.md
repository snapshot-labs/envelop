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

Unit test does not depends on the database, and can safely run locally with:

```
yarn test
```

This will run all tests

## Licence

Envelop is open-sourced software licensed under the © [MIT license](LICENSE).
