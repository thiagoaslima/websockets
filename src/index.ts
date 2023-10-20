import {server} from './server.js';
import {extendServerWithWebsocket} from './websocket_server.js';
const PORT = 1337;
extendServerWithWebsocket(server);
server.listen({port: PORT, host: '0.0.0.0'}, (err, address) => {
  if (err) throw err;
  console.log(`Server listening at ${address}`);
});
