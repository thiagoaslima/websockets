import {HelloWorldType} from '../schemata/hello_world.js';
import {GetRequestHandler} from '../types/handlers.js';

/**
 * Standalone handler for the "/" route.
 */
export const helloWorld: GetRequestHandler<HelloWorldType> = async (
  _,
  reply
) => {
  return reply.status(200).send({
    geeting: 'Hello world!',
  });
};
