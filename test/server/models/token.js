'use strict';
const Token = require('../../../server/models/token');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');

lab.experiment('Token Model', () => {

  lab.before(async () => {

    await Token.connect(config.connection,config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Token.disconnect();
  });

  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      userId: '1234',
      description: 'sample token'
    };

    const token = await Token.create(document);

    Code.expect(token).to.be.an.instanceOf(Token);
    Code.expect(token.userId).to.equal('1234');
    Code.expect(token.description).to.equal('sample token');

  });

});
