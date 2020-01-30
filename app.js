class App {
  constructor() {
    this.routes = [];
  }
  get(path, handler) {
    this.routes.push({ path, handler, method: 'GET' });
  }
  post(path, handler) {
    this.routes.push({ path, handler, method: 'POST' });
  }
  use(middleware) {
    this.routes.push({ handler: middleware });
  }
  serve(req, res) {
    // eslint-disable-next-line no-console
    console.log('Request: ', req.url, req.method);
    const matchingHandlers = this.routes.filter(route =>
      matchRoute(route, req)
    );

    const next = function() {
      if (matchingHandlers.length === false) {
        return;
      }
      const router = matchingHandlers.shift();
      router.handler(req, res, next);
    };
    next();
  }
}

const matchRoute = function(route, req) {
  if (route.method) {
    return req.method === route.method && req.url.match(route.path);
  }
  return true;
};

module.exports = App;
