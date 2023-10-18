import fastify from 'fastify';
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import routes from './routes.js';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

export const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

server.register(fastifyStatic, {
  root: path.resolve('./src/public'),
});
server.register(routes);
