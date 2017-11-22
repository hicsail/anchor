'use strict';
const Token = require('../../../server/models/token');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Token Class Methods', () => {

  lab.before((done) => {

    Token.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Token.deleteMany({}, (err, count) => {

      Token.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Token.create('name', 'userID', (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Token);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Token.insertOne;
    Token.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Token.create('name', 'userID', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Token.insertOne = realInsertOne;

      done();
    });
  });
});
