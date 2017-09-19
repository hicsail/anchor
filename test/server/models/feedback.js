'use strict';
const Feedback = require('../../../server/models/feedback');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Feedback Class Methods', () => {

  lab.before((done) => {

    Feedback.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Feedback.deleteMany({}, (err, count) => {

      Feedback.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Feedback.create('subject', 'description', 'userID', (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Feedback);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Feedback.insertOne;
    Feedback.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Feedback.create('subject', 'description', 'userID', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Feedback.insertOne = realInsertOne;

      done();
    });
  });
});
