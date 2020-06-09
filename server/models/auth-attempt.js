'use strict';
const Async = require('async');
const Config = require('../../config');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');


class AuthAttempt extends AnchorModel {
  static create(ip, username, application, callback) {

    const document = {
      ip,
      username: username.toLowerCase(),
      application,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }

  static abuseDetected(ip, username, callback) {

    const self = this;

    Async.auto({
      abusiveIpCount: function (done) {

        const query = { ip };
        self.count(query, done);
      },
      abusiveIpUserCount: function (done) {

        const query = {
          ip,
          username: username.toLowerCase()
        };

        self.count(query, done);
      }
    }, (err, results) => {

      if (err) {
        return callback(err);
      }

      const authAttemptsConfig = Config.get('/authAttempts');
      const ipLimitReached = results.abusiveIpCount >= authAttemptsConfig.forIp;
      const ipUserLimitReached = results.abusiveIpUserCount >= authAttemptsConfig.forIpAndUser;

      callback(null, ipLimitReached || ipUserLimitReached);
    });
  }

  static deleteAuthAttempts(ip, username, callback) {

    AuthAttempt.deleteMany({
      username,
      ip
    }, callback);
  }
}


AuthAttempt.collectionName = 'authAttempts';


AuthAttempt.schema = Joi.object({
  _id: Joi.object(),
  username: Joi.string().lowercase().required(),
  application: Joi.string().required(),
  ip: Joi.string().required(),
  time: Joi.date().required()
});


AuthAttempt.indexes = [
  { key: { ip: 1, username: 1 } },
  { key: { username: 1 } }
];


module.exports = AuthAttempt;

