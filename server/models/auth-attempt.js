'use strict';
const Assert = require('assert');
const Config = require('../../config');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');
const UserAgent = require('useragent');
const Hoek = require('hoek');

class AuthAttempt extends AnchorModel {

  static async create(ip, username, userAgent) {

    Assert.ok(ip, 'Missing ip argument.');
    Assert.ok(username, 'Missing username argument.');
    Assert.ok(userAgent, 'Missing userAgent argument.');

    const agentInfo = UserAgent.lookup(userAgent);
    const browser = agentInfo.family;

    const document = new this({
      browser,
      ip: ip,
      os: agentInfo.os.toString(),
      username: username
    });

    const authAttempts = await this.insertOne(document);

    return authAttempts[0];
  }

  static async abuseDetected(ip, username) {

    Assert.ok(ip, 'Missing ip argument.');
    Assert.ok(username, 'Missing username argument.');

    const [countByIp, countByIpAndUser] = await Promise.all([
      this.count({ ip }),
      this.count({ ip, username })
    ]);

    const config = Config.get('/authAttempts');
    const ipLimitReached = countByIp >= config.forIp;
    const ipUserLimitReached = countByIpAndUser >= config.forIpAndUser;

    return ipLimitReached || ipUserLimitReached;
  }
}


AuthAttempt.collectionName = 'authAttempts';

AuthAttempt.schema = Joi.object({
  _id: Joi.object(),
  browser: Joi.string(),
  ip: Joi.string().required(),
  os: Joi.string().required(),
  username: Joi.string().lowercase().required(),
  createdAt: Joi.date().default(new Date(), 'time of creation')
});

AuthAttempt.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Joi.object({})
  },
  update: {
    payload: Joi.object({})
  },
  tableView: {
    outputDataFields: {
      username: {label: 'Username'},
      ip: {label: 'IP'},
      createdAt: {label: 'Time'},
      _id: {label: 'ID', accessRoles: ['admin', 'researcher','root'], invisible: true},
      os: {label: 'OS', invisible: true},
      browser: {label: 'browser', invisible: true},

    }
  },
  createView: {
    createSchema: Joi.object({})
  }
});

AuthAttempt.lookups = [];

AuthAttempt.indexes = [
  { key: { ip: 1, username: 1 } },
  { key: { username: 1 } }
];

module.exports = AuthAttempt;
