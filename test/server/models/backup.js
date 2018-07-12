'use strict';
const Backup = require('../../../server/models/backup');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');


lab.experiment('Backup Model', () => {

  lab.before(async () => {

    await Backup.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });


  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Backup.disconnect();
  });


  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      filename: 'test',
      local: true,
      s3: false
    };

    const backup = await Backup.create(document);

    Code.expect(backup).to.be.an.instanceOf(Backup);
    Code.expect(backup.filename).to.equal('test');
    Code.expect(backup.local).to.equal(true);
    Code.expect(backup.s3).to.equal(false);

  });
});
