const fs = require('fs');
const App = require('./app');
const CONTENT_TYPES = require('./mimeTypes');
const commentList = require('./commentList.json');
const querystring = require('querystring');

const STATIC_FOLDER = `${__dirname}/../public`;

const getExtension = function(path) {
  return path.match(/.*\.(.*)$/) || [];
};

const checkForFile = function(path) {
  const stat = fs.existsSync(path) && fs.statSync(path);
  return !stat || !stat.isFile();
};

const givePath = function(url) {
  const homepage = `${STATIC_FOLDER}/html/index.html`;
  const staticPath = `${STATIC_FOLDER}${url}`;
  return url === '/' ? homepage : staticPath;
};

const serveStaticPage = (req, res, next) => {
  const path = givePath(req.url);

  if (checkForFile(path)) {
    return next();
  }

  const [, extension] = getExtension(path);
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.end(content);
};

const getDateAndTime = function(dateString) {
  const newDate = new Date(dateString);
  const hour = newDate.getHours();
  const minutes = newDate.getMinutes();
  const [, date] = newDate
    .toJSON()
    .split('T')
    .reverse();
  return `${date} ${hour}:${minutes}`;
};

const serveGuestBookPost = function(req, res) {
  const date = new Date();
  const { name, commentString } = querystring.parse(req.body);
  const commentMsg = parseComment(commentString);
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
  const message = decodeURIComponent(comment);
  return message.replace(/\+/g, ' ');
};

const getCommentMessage = function(comment) {
  const message = comment.replace(/\r\n/g, '<br>');
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
  const content = fs.readFileSync('./public/html/guestBook.html', 'utf8');
  const pattern = new RegExp('__comment__', 'g');
  return content.replace(pattern, html);
};

const serveNotFound = function(req, res) {
  res.statusCode = 404;
  res.end('File Not Found');
};

const readBody = function(req, res, next) {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.body = data;
    next();
  });
};

const methodNotAllowed = function(req, res) {
  res.statusCode = 400;
  res.end('Method Not Allowed');
};

const app = new App();

app.use(readBody);
app.get('/html/guestBook.html', serveGuestBook);
app.get('', serveStaticPage);
app.post('/html/redirect', serveGuestBookPost);
app.get('', serveNotFound);
app.post('', serveNotFound);
app.use(methodNotAllowed);

module.exports = app;
