const fs = require('fs');
const CONTENT_TYPES = require('./lib/mimeTypes');
const commentList = require('./commentList.json');

const STATIC_FOLDER = `${__dirname}/public`;

const serveStaticFile = (req, res) => {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return serveNotFound(req, res);
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.end(content);
};

const serveHomePage = (req, res) => {
  const html = fs.readFileSync('index.html', 'utf8');
  if (!req.headers['Cookie'])
    res.setHeader('Set-Cookie', `sessionId=${new Date().getTime()}`);
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.end(html);
};

const getDateAndTime = function(dateString) {
  let newDate = new Date(dateString);
  const hour = newDate.getHours();
  const minutes = newDate.getMinutes();
  const date = newDate.toJSON().slice(0, 10);
  return `${date} ${hour}:${minutes}`;
};

const serveGuestBookPost = function(req, res, body) {
  const date = new Date();
  let { name, commentMsg } = body;
  commentMsg = parseComment(commentMsg);
  commentList.unshift({ name, commentMsg, date });
  fs.writeFileSync(
    './commentList.json',
    JSON.stringify(commentList),
    'utf8'
  );
  res.setHeader('Location', '/html/guestBook.html');
  res.statusCode = 302;
  res.end();
};

const serveGuestBook = function(req, res) {
  const html = getGustBookHtml(commentList);
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.end(html);
};

const parseComment = function(comment) {
  let message = decodeURIComponent(comment);
  return message.replace(/\+/g, ' ');
};

const getCommentMessage = function(comment) {
  let message = comment.replace(/\r\n/g, '<br>');
  return message.replace(/\s/g, '&nbsp');
};

const getGustBookHtml = function(commentList) {
  let html = '&nbsp';
  commentList.forEach(comment => {
    const dateAndTime = getDateAndTime(comment.date);
    const commentMsg = getCommentMessage(comment.commentMsg);
    html += `<div class="eachComment">
      <div class="commentHeading">
        <img src="/images/logo.jpg" alt="" class="logo" />
        <span class="commenterName">${comment.name}</span>&nbsp;
        <span class="dateAndTime">${dateAndTime}</span>
      </div>
      <div class="commenterMsg">
      ${commentMsg}
      </div>
    </div>`;
  });
  let content = fs.readFileSync('./public/html/guestBook.html', 'utf8');
  const pattern = new RegExp(`__comment__`, 'g');
  return content.replace(pattern, html);
};

const serveNotFound = function(req, res) {
  res.statusCode = 404;
  res.end('File Not Found');
};

const findHandler = req => {
  if (req.method === 'GET') {
    if (req.url === '/') return serveHomePage;
    if (req.url === '/html/guestBook.html') return serveGuestBook;
    return serveStaticFile;
  }
  if (req.method === 'POST') {
    if (req.url === '/html/redirect') return serveGuestBookPost;
  }
  return serveNotFound;
};
const processRequest = (req, res, body) => {
  const handler = findHandler(req);
  return handler(req, res, body);
};

module.exports = processRequest;
