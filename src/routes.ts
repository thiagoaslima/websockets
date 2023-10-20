import {
  FastifyInstance,
  FastifyServerOptions,
  HookHandlerDoneFunction,
} from 'fastify';

export default function (
  app: FastifyInstance,
  _: FastifyServerOptions,
  done: HookHandlerDoneFunction
) {
  /** Root route */
  app.get(
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

  done();
}
