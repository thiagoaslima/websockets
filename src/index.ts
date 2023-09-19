import {server} from './server.js';

server.listen({ port: 1337 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
})
