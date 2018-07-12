'use strict';
const Analytic = require('../../../server/models/analytic');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');


lab.experiment('Analytic Model', () => {

  lab.before(async () => {

    await Analytic.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });


  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Analytic.disconnect();
  });


  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      event: 'page_view',
      name: 'LoginPage'
    };

    const analytic = await Analytic.create(document);

    Code.expect(analytic).to.be.an.instanceOf(Analytic);
    Code.expect(analytic.event).to.equal('page_view');
    Code.expect(analytic.name).to.equal('LoginPage');

  });
});
