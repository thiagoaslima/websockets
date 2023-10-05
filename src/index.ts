import {server} from './server.js';

server.listen({port: 1337}, (err, address) => {
  if (err) throw err;
  console.log(`Server listening at ${address}`);
});
