'use strict';
const Role = require('../../../server/models/role');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');


lab.experiment('Role Model', () => {

  lab.before(async () => {

    await Role.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });


  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Role.disconnect();
  });


  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      name: 'clinician',
      permissions: {},
      filter: [],
      userId: '0'
    };

    const role = await Role.create(document);

    Code.expect(role).to.be.an.instanceOf(Role);
    Code.expect(role.name).to.equal('clinician');
    Code.expect(role.permissions).to.equal({});
    Code.expect(role.filter).to.equal([]);
    Code.expect(role.userId).to.equal('0');

  });
});
