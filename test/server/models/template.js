'use strict';
const Template = require('../../../server/models/template');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Template Class Methods', () => {

  lab.before((done) => {

    Template.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Template.deleteMany({}, (err, count) => {

      Template.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Template.create(
      name,
      userId,
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Template);

        done();
      });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Template.insertOne;
    Template.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Template.create(
      name,
      userId,
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Template.insertOne = realInsertOne;

        done();
      });
  });
});
