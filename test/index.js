const test = require('tape-async');
const shrek = require('..');

test('add details files', function *(t) {
  const result = yield shrek();
  t.equal(result, 42);
});
