import {server} from './server.js';
const PORT = process.env.PORT || 1337;

server.listen({port: PORT, host: '0.0.0.0'}, (err, address) => {
  if (err) throw err;
  console.log(`Server listening at ${address}`);
});
