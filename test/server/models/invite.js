'use strict';
const Invite = require('../../../server/models/invite');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');


lab.experiment('Invite Model', () => {

  lab.before(async () => {

    await Invite.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });


  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Invite.disconnect();
  });


  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      username: 'test',
      email: 'test@gmail.com',
      name: 'Test Test',
      role: [],
      permission: {},
      userId: 'John',
      status: 'Pending'
    };

    const invite = await Invite.create(document);

    Code.expect(invite).to.be.an.instanceOf(Invite);
    Code.expect(invite.email).to.equal('test@gmail.com');
    Code.expect(invite.status).to.equal('Pending');

  });
});
