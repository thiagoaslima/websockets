import WebSocket from 'ws';
import fastify from 'fastify';
import websocket from '@fastify/websocket';

export function extendServerWithWebsocket(server: fastify.FastifyInstance) {
  const host = 'localhost';
  const port = 1234;
  const wss = new WebSocket.Server({noServer: true});

  server.register(websocket);

  server.get('/ws', {websocket: true}, function wsHandler(connection, req) {
    console.log('WebSocket connection initiated');
    connection.socket.on('message', message => {
      console.log('Message received:', message.toString());
      connection.socket.send('hi from server');
    });

    connection.socket.on('error', error => {
      console.error('WebSocket Error:', error);
    });

    connection.socket.on('open', () => {
      console.log('WebSocket Connection Established');
    });

    connection.socket.on('close', (code, reason) => {
      console.log(
        'WebSocket Connection Closed. Code:',
        code,
        'Reason:',
        reason
      );
    });
  });
}
