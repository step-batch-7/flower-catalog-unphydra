const fs = require('fs');
const Response = require('./lib/response');
const CONTENT_TYPES = require('./lib/mimeTypes');
const { loadTemplate } = require('./lib/viewTemplate');

const STATIC_FOLDER = `${__dirname}/public`;
let visitorCount = 0;

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
const generateStudentResponse = student => {
  const html = loadTemplate('student.html', student);
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
};
const registerStudent = req => {
  return generateStudentResponse(req.query);
};
const registerStudentPost = req => {
  return generateStudentResponse(req.body);
};
const findHandler = req => {
  if (req.method === 'GET' && req.url === '/') return serveHomePage;
  // if (req.method === 'GET' && req.url === '/visitorCount')
  //   return serveVisitorCount;
  // if (req.method === 'GET' && req.url === '/registerStudent')
  //   return registerStudent;
  if (req.method === 'GET') return serveStaticFile;
  return () => new Response();
};
const processRequest = req => {
  const handler = findHandler(req);
  return handler(req);
};

module.exports = { processRequest };
