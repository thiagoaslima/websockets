import WebSocket from 'ws';
import fastify from 'fastify';
import websocket from '@fastify/websocket';

export function extendServerWithWebsocket(server: fastify.FastifyInstance) {
  const host = 'localhost';
  const port = 1234;
  const wss = new WebSocket.Server({noServer: true});

  server.register(websocket);

  server.get('/ws', {websocket: true}, function wsHandler(connection, req) {
    // bound to fastify server

    connection.socket.on('message', message => {
      // message.toString() === 'hi from client'
      connection.socket.send('hi from server');
    });
  });
}
