'use strict';
const Backup = require('../../../server/models/backup');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Backup Class Methods', () => {

  lab.before((done) => {

    Backup.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Backup.deleteMany({}, (err, count) => {

      Backup.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Backup.create('backupID', true, true, (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Backup);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Backup.insertOne;
    Backup.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Backup.create('backupID', true, true, (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Backup.insertOne = realInsertOne;

      done();
    });
  });
});
