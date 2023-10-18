import {
  FastifyInstance,
  FastifyServerOptions,
  HookHandlerDoneFunction,
} from 'fastify';
import {HelloWorld, HelloWorldType} from './schemata/hello_world.js';
import {helloWorld} from './handlers/hello_world.js';
import {
  JsonQueryType,
  JsonQueryResponseType,
  JsonQueryResponse,
} from './schemata/json_query.js';
import {transformJsonQuery} from './handlers/transform.js';

export default function (
  app: FastifyInstance,
  _: FastifyServerOptions,
  done: HookHandlerDoneFunction
) {
  /** Root route */
  app.get<{Reply: HelloWorldType}>(
    '/',
    (req, reply) => reply.sendFile('index.html')
    /**
    {
      schema: {
        response: {
          200: HelloWorld,
        },
      },
    },
    helloWorld
    **/
  );

  app.post<{Body: JsonQueryType; Reply: JsonQueryResponseType}>(
    '/transformation/json-query',
    {
      schema: {
        response: {
          200: JsonQueryResponse,
        },
      },
    },
    transformJsonQuery
  );

  done();
}
