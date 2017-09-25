'use strict';
const Async = require('async');
const MongoModels = require('mongo-models');
const Mongodb = require('mongodb');
const Promptly = require('promptly');
const User = require('./server/models/user');

Async.auto({
  mongodbUri: (done) => {

    const options = {
      default: 'mongodb://localhost:27017/anchor'
    };

    Promptly.prompt(`MongoDB URI: (${options.default})`, options, done);
  },
  testMongo: ['mongodbUri', (results, done) => {

    Mongodb.MongoClient.connect(results.mongodbUri, {}, (err, db) => {

      if (err) {
        console.error('Failed to connect to Mongodb.');
        return done(err);
      }

      db.close();
      done(null, true);
    });
  }],
  rootEmail: ['testMongo', (results, done) => {

    Promptly.prompt('Root user email:', done);
  }],
  rootPassword: ['rootEmail', (results, done) => {

    Promptly.password('Root user password:', done);
  }],
  setupRootUser: ['rootPassword', (results, done) => {

    Async.auto({
      connect: function (done) {

        MongoModels.connect(results.mongodbUri, {}, done);
      },
      user: ['connect', function (dbResults, done) {

        Async.auto({
          passwordHash: function (done) {

            User.generatePasswordHash(results.rootPassword,done);
          }
        }, (err, passResults) => {

          if (err) {
            return done(err);
          }

          const document = {
            _id: User.ObjectId('000000000000000000000000'),
            isActive: true,
            username: 'root',
            password: passResults.passwordHash.hash,
            email: results.rootEmail.toLowerCase(),
            roles: {
              root: true
            },
            timeCreated: new Date()
          };

          User.insertOne(document, (err, docs) => {

            done(err, docs && docs[0]);
          });
        });
      }]
    }, (err, dbResults) => {

      if (err) {
        console.error('Failed to setup root user.');
        return done(err);
      }

      done(null, true);
    });
  }]
}, (err, results) => {

  if (err) {
    console.error('Setup failed.');
    console.error(err);
    return process.exit(1);
  }

  console.log('Setup complete.');
  process.exit(0);
});
