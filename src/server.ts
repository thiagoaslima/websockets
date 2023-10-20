import fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';

import routes from './routes.js';
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';

export const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

server.register(fastifyCors, {
  origin: '*',
  logLevel: 'warn',
});

server.register(fastifyStatic, {
  root: new URL('static', import.meta.url),
});

await server.register(websocket);
server.register(routes);
