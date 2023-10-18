import fastify from 'fastify';
import WebSocket from 'ws';
import {setupWSConnection} from './utils/websockets.js';

export function extendServerWithWebsocket(server: ReturnType<typeof fastify>) {
  const host = 'localhost';
  const port = 1234;
  const wss = new WebSocket.Server({noServer: true});

  wss.on('connection', setupWSConnection);

  server.on('upgrade', (request, socket, head) => {
    // You may check auth of request here..
    // See https://github.com/websockets/ws#client-authentication
    /**
     * @param {any} ws
     */
    const handleAuth = ws => {
      wss.emit('connection', ws, request);
    };
    wss.handleUpgrade(request, socket, head, handleAuth);
  });

  server.listen(port, host, () => {
    console.log(`running at '${host}' on port ${port}`);
  });
}
