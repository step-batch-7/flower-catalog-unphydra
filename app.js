const fs = require('fs');
const Response = require('./lib/response');
const CONTENT_TYPES = require('./lib/mimeTypes');

const STATIC_FOLDER = `${__dirname}/public`;

const serveStaticFile = req => {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  const res = new Response();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.body = content;
  return res;
};

const serveHomePage = req => {
  const html = fs.readFileSync('index.html', 'utf8');
  const res = new Response();
  if (!req.headers['Cookie'])
    res.setHeader('Set-Cookie', `sessionId=${new Date().getTime()}`);
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
};

const findHandler = req => {
  if (req.method === 'GET') {
    if (req.url === '/') return serveHomePage;
    return serveStaticFile;
  }
  return () => new Response();
};
const processRequest = req => {
  const handler = findHandler(req);
  return handler(req);
};

module.exports = { processRequest };
