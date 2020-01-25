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

const serveGuestBook = function(req) {
  if (req.method == 'POST') {
    let date = new Date().toJSON().slice(0, -5);
    date = date.replace(/T/, ' ');
    let { name, commentMsg } = req.body;
    commentMsg = decodeURIComponent(commentMsg);
    commentMsg = commentMsg.replace(/\+/g, ' ');
    commentList.push({ name, commentMsg, date });
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

const getGustBookHtml = function(commentList) {
  let divs = `<div class="eachComment">
  <div class="commentName">Date Name</div>
  <div>Comment</div>
</div>`;
  commentList.forEach(comment => {
    const dateAndName = `<div class="commentName">${comment.date} -> ${comment.name}</div>`;
    const msg = `<p>${comment.commentMsg}</p>`;
    divs += `<div class="eachComment">
    ${dateAndName}
    ${msg}
  </div>`;
  });
  let content = fs.readFileSync('./public/html/guestBook.html', 'utf8');
  const pattern = new RegExp(`__comment__`, 'g');
  return content.replace(pattern, divs);
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
