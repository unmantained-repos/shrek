const makeServer = require('..').server;
const test = require('tape-async');
const fetch = require('node-fetch');
const basicAuthHeader = require('basic-auth-header');

function helloName(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

function getUser(req, res, next) {
  res.send(req.user);
  next();
}

function prepareServer() {
  const server = makeServer({
    publicRoutes: ['/hello/tests'],
    getUser: username => username !== 'testuser' ? Promise.resolve(null) :  Promise.resolve({
      username: username,
      password: '$2a$10$WOt4.me8X5cEeLQEbjtMLuXvkr/F9F4NIT9Kzz1.8cNpC0szuuN0q'
    })
  });
  server.get('/hello/:name', helloName);
  server.get('/protected', getUser);

  return new Promise( resolve => {
    server.listen(9080, () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

test('energy server respond', function * (t) {
  const server = yield prepareServer();
  const res = yield fetch('http://localhost:9080/hello/tests');
  const result = yield res.json();
  t.equal(result, 'hello tests');

  return close(server);
});

function * fetchToken() {
  const res = yield fetch('http://localhost:9080/token', {
    headers: {
      authorization: basicAuthHeader('testuser', 'testpwd')
    }
  });
  const result = yield res.json();
  return result.token;
}

test('/auth/token return a jwt token if auth succeed', function * (t) {
  const server = yield prepareServer();
  const token = yield fetchToken();

  t.equal(typeof token, 'string');
  t.ok(token.length > 30, 'token too short');
  return close(server);
});

test('/auth/token return 403 if auth fails on bad user', function * (t)  {
  const server = yield prepareServer();

  const res = yield fetch('http://localhost:9080/token', {
    headers: {
      authorization: basicAuthHeader('baduser', 'testpwd')
    }
  });
  t.equal(res.status, 403);
  return close(server);
});

test('/auth/token return 403 if auth fails on bad password', function * (t)  {
  const server = yield prepareServer();

  const res = yield fetch('http://localhost:9080/token', {
    headers: {
      authorization: basicAuthHeader('testuser', 'badpwd')
    }
  });
  t.equal(res.status, 403);
  return close(server);
});


test('/auth/token return 403 if auth fails on password empty', function * (t)  {
  const server = yield prepareServer();

  const res = yield fetch('http://localhost:9080/token', {
    headers: {
      authorization: basicAuthHeader('testuser', '')
    }
  });
  t.equal(res.status, 403);
  return close(server);
});


test('/auth/token return 403 if not auth provided', function * (t)  {
  const server = yield prepareServer();

  const res = yield fetch('http://localhost:9080/token');
  t.equal(res.status, 403);
  return close(server);
});


test('/protected return user if valid token provided', function * (t)  {
  const server = yield prepareServer();
  const token = yield fetchToken();

  const res = yield fetch('http://localhost:9080/protected', {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  const result = yield res.json();
  t.equal(result.sub, 'testuser');
  return close(server);
});

test('/protected return 401 if no token provided', function * (t)  {
  const server = yield prepareServer();
  const res = yield fetch('http://localhost:9080/protected');

  t.equal(res.status, 401);
  return close(server);
});


test('/protected return 401 if bad token provided', function * (t)  {
  const server = yield prepareServer();
  const res = yield fetch('http://localhost:9080/protected', {
    headers: {
      authorization: `Bearer badftoken`
    }
  });

  t.equal(res.status, 401);
  return close(server);
});


