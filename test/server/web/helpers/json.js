'use strict';
const Code = require('code');
const Lab = require('lab');
const JsonHelper = require('../../../../server/web/helpers/json');
const lab = exports.lab = Lab.script();
const context = {
  fn: function () {

    return true;
  },
  inverse: function () {

    return false;
  }
};

lab.experiment('JSON Helper', () => {

  const testObject = { hello:'world' };

  lab.test('it returns false when context is empty', (done) => {

    const results = JsonHelper(testObject, null);

    Code.expect(results).to.equal(false);
    done();
  });

  lab.test('it returns object when passes', (done) => {

    const results = JsonHelper(testObject, context);

    Code.expect(results).to.equal('{"hello":"world"}');
    done();
  });
});
