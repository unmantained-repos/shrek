const jsonwebtoken = require('jsonwebtoken');
const thenify = require('thenify');
const co = require('co');
const bcrypt = require('bcrypt-nodejs');

const compare = thenify(bcrypt.compare);

module.exports = (secret, jwtIssuer, getUser) => co.wrap(function * (req, res, next) {
  const auth = req.authorization.basic;
  const failed = () => {
    res.send(403);
    next();
  };
  if (!auth || !auth.username || !auth.password) {
    return failed();
  }

  const user = yield getUser(auth.username);
  if (user === null) {
    return failed();
  }

  const passwordValid = yield compare(auth.password, user.password);
  if (!passwordValid) {
    return failed();
  }

  const payload = {
    iss: jwtIssuer,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 10,
    sub: auth.username
  };
  const token = jsonwebtoken.sign(payload, secret);
  res.send({token});
});
