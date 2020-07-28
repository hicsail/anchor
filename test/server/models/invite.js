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
    
      const email = 'test@gmail.com';
      const name = 'Test Test';     
      const userId =  'John';
      const description = 'This is a test invitation';
    

    const invite = await Invite.create(name, email, description, userId);

    Code.expect(invite).to.be.an.instanceOf(Invite);
    Code.expect(invite.email).to.equal('test@gmail.com');
    Code.expect(invite.status).to.equal('Pending');

  });
});
