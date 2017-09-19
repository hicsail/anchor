'use strict';
const Event = require('../../../server/models/event');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Event Class Methods', () => {

  lab.before((done) => {

    Event.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Event.deleteMany({}, (err, count) => {

      Event.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Event.create('eventName', 'userID', (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Event);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Event.insertOne;
    Event.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Event.create('eventName', 'userID', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Event.insertOne = realInsertOne;

      done();
    });
  });
});
