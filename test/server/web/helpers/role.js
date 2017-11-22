'use strict';
const Code = require('code');
const Lab = require('lab');
const RoleHelper = require('../../../../server/web/helpers/role');
const lab = exports.lab = Lab.script();
const context = {
  fn: function () {

    return true;
  },
  inverse: function () {

    return false;
  }
};

lab.experiment('Role Helper', () => {

  const rootUser = {
    roles: {
      root: true
    }
  };

  const adminUser = {
    roles: {
      admin: true
    }
  };

  const researcher = {
    roles: {
      researcher: true
    }
  };

  const user = {
    roles: {
    }
  };

  lab.test('it return false for empty context', (done) => {

    const results = RoleHelper(rootUser, 'root', null);

    Code.expect(results).to.equal(false);

    done();

  });

  lab.test('it return true for root for root', (done) => {

    const results = RoleHelper(rootUser, 'root', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return false for admin for root', (done) => {

    const results = RoleHelper(adminUser, 'root', context);

    Code.expect(results).to.equal(false);

    done();

  });

  lab.test('it return true for admin for root', (done) => {

    const results = RoleHelper(rootUser, 'admin', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return true for admin for admin', (done) => {

    const results = RoleHelper(adminUser, 'admin', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return false for researcher for admin', (done) => {

    const results = RoleHelper(researcher, 'admin', context);

    Code.expect(results).to.equal(false);

    done();

  });

  lab.test('it return true for root for researcher', (done) => {

    const results = RoleHelper(rootUser, 'researcher', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return true for admin for researcher', (done) => {

    const results = RoleHelper(adminUser, 'researcher', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return false for researcher for researcher', (done) => {

    const results = RoleHelper(researcher, 'researcher', context);

    Code.expect(results).to.equal(true);

    done();

  });

  lab.test('it return false for user for researcher', (done) => {

    const results = RoleHelper(user, 'researcher', context);

    Code.expect(results).to.equal(false);

    done();

  });
});
