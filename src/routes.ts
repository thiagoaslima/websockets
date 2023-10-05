import {
  FastifyInstance,
  FastifyServerOptions,
  HookHandlerDoneFunction,
} from 'fastify';
import {HelloWorld, HelloWorldType} from './schemata/hello_world.js';
import {helloWorld} from './handlers/hello_world.js';

export default function (
  app: FastifyInstance,
  _: FastifyServerOptions,
  done: HookHandlerDoneFunction
) {
  /** Root route */
  app.get<{Reply: HelloWorldType}>(
    '/',
    {
      schema: {
        response: {
          200: HelloWorld,
        },
      },
    },
    helloWorld
  );

  done();
}
