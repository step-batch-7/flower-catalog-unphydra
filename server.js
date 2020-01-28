const http = require('http');
const queryString = require('querystring');
const processRequest = require('./app');

const handleConnection = function(req, res) {
  console.log('url:', req.url, 'method:', req.method);
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => {
    const body = queryString.parse(data);
    processRequest(req, res, body);
  });
};
const main = (port = 4000) => {
  const server = new http.Server(handleConnection);
  server.on('error', err => console.error('server error', err));
  server.on('listening', () =>
    console.warn('started listening', server.address())
  );
  server.listen(port);
};
main(process.argv[2]);
