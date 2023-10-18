import {FastifyInstance} from 'fastify';
export function extendServerWithWebsocket(server: FastifyInstance) {
  server.get('/ws', {websocket: true}, (connection, req) => {
    console.log('WebSocket connection initiated');

    connection.socket.on('connection', message => {
      console.log('Message received:', message.toString());
      connection.socket.send('hi from server');
    });

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
