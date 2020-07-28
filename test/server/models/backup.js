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

    const backup = await Backup.create('test', true, false);

    Code.expect(backup).to.be.an.instanceOf(Backup);
    Code.expect(backup.backupId).to.equal('test');
    Code.expect(backup.zip).to.equal(true);
    Code.expect(backup.s3).to.equal(false);

  });
});