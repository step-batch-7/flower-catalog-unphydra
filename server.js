const http = require('http');
const app = require('./handlers');

const defaultPort = 4000;

const main = ([,, port = defaultPort]) => {
  const server = new http.Server(app.serve.bind(app));
  // eslint-disable-next-line no-console
  server.on('error', err => console.error('server error', err));
  server.on('listening', () =>
    // eslint-disable-next-line no-console
    console.warn('started listening', server.address())
  );
  server.listen(port);
};
main(process.argv);
