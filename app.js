const fs = require('fs');
const Response = require('./lib/response');
const CONTENT_TYPES = require('./lib/mimeTypes');
const commentList = require('./commentList.json');

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

const getDateAndTime = function(dateString) {
  let newDate = new Date(dateString);
  const hour = newDate.getHours();
  const minutes = newDate.getMinutes();
  const date = newDate.toJSON().slice(0, 10);
  return `${date} ${hour}:${minutes}`;
};

const serveGuestBook = function(req) {
  if (req.method == 'POST') {
    const date = new Date();
    let { name, commentMsg } = req.body;
    commentMsg = parseComment(commentMsg);
    commentList.unshift({ name, commentMsg, date });
    fs.writeFileSync(
      './commentList.json',
      JSON.stringify(commentList),
      'utf8'
    );
  }
  const html = getGustBookHtml(commentList);
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
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

const findHandler = req => {
  if (req.url === '/html/guestBook.html') return serveGuestBook;
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
