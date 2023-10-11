# Builder Service

_In progress._

## Development

Dependencies:
* NodeJS version 20 or greater.
* The latest version of NPM

To get up and running, do the following:

1. Install local dependenceis.
```sh
$ npm install
```

2. Run the development server.
```sh
$ npm run dev
```

### Testing

You should really be doing TDD, and we have this service setup for that.

To run tests once, execute the following:
```sh
$ npm run test
```

But to have tests automatically reload as you write them, run this:
```sh
$ npm run test:watch
```

## Build

To build the service for production, do the following:

1. Compile the TypeScript into JavaScript using SWC:
```sh
$ npm run build
```

2. Ensure the app runs normally when compiled:
```sh
$ npm start
```

## Code Review

Please be use to run the linter before submitting an MR:

```
npm run lint
```

You can also automatically fix linting errors by running:

```
npm run fix
```

## Documentation
* [Fastify docs](https://fastify.dev/docs/latest/)
* [TypeBox docs](https://github.com/sinclairzx81/typebox)
* [SWC docs](https://swc.rs/)
