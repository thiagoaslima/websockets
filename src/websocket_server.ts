import {FastifyInstance} from 'fastify';
import {setupWSConnection} from './utils/websockets.js';

export function extendServerWithWebsocket(server: FastifyInstance) {
  server.setErrorHandler((error, req, reply) => {
    console.error(error);
  });

  server.get('/ws/:room', {websocket: true}, (connection, req) => {
    console.log('WebSocket connection initiated');
    setupWSConnection(connection.socket, req);

    /*
    connection.socket.on('connection', message => {
      console.log('Message received:', message.toString());
      console.log('Connecting...');
      setupWSConnection(connection.socket, req);
    });*/
    
    /*
    connection.socket.on('message', message => {
      console.log('Message received:', message.toString());
    });
    */

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
