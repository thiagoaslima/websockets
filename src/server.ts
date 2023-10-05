import fastify from 'fastify';
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import routes from './routes.js';

export const server = fastify().withTypeProvider<TypeBoxTypeProvider>();

server.register(routes);
