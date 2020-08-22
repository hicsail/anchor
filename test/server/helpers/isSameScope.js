'use strict';
const Code = require('code');
const Lab = require('lab');
const IsSameScope = require('../../../server/helpers/isSameScope');
const lab = exports.lab = Lab.script();

lab.experiment('Same Scope Helper', () => {

  lab.test('return false if scopes size are of different lengths', (done) => {

    const scope1 = ['root'];
    const scope2 = ['root', 'admin'];
    Code.expect(IsSameScope(scope1, scope2)).to.equal(false);
    done();
  });

  lab.test('returns true if scopes are identical', (done) => {

    const scope1 = ['root', 'admin'];
    const scope2 = ['root', 'admin'];
    Code.expect(IsSameScope(scope1, scope2)).to.equal(true);
    done();
  });
});
