const restify = require('restify');
const restifyJwt = require('restify-jwt');
const getToken = require('./get-token');

const secret = 'very';
const jwtIssuer = 'energy';

module.exports = function makeServer(model) {
  const server = restify.createServer();

  const arePublicRoutes = {
    path: ['/token'].concat(model.publicRoutes || [])
  };
  const authorize = restifyJwt({secret}).unless(arePublicRoutes);
  server.use(restify.CORS({ // eslint-disable-line
    headers: [
      'authorization'
    ],
    credentials: true
  }));
  server.use(restify.authorizationParser());
  server.use(authorize);
  server.get('/token', getToken(secret, jwtIssuer, model.getUser));
  server.opts('/token', (req, res, next) => {
    if (req.method === 'OPTIONS') {
      process.stderr.write('Origin allowed');
      return res.send(200, 'Origin access allowed.');
    }
    process.stderr.write(req.method);
    next();
  });

  return server;
};
