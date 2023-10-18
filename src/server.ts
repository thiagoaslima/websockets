import path from 'node:path';
import fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';

import routes from './routes.js';
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';

export const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

server.register(fastifyStatic, {
  root: path.resolve('./src/public'),
});

await server.register(websocket);
server.register(routes);
