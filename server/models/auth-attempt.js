'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Assert = require('assert');
const Config = require('../../config');
const Joi = require('joi');
const UserAgent = require('useragent');
const Hoek = require('hoek');

class AuthAttempt extends AnchorModel {

  static async create(document) {

    Assert.ok(document.ip, 'Missing ip argument.');
    Assert.ok(document.username, 'Missing username argument.');
    Assert.ok(document.userAgent, 'Missing userAgent argument.');

    const agentInfo = UserAgent.lookup(document.userAgent);
    const browser = agentInfo.family;

    document = new this({
      browser,
      ip: document.ip,
      os: agentInfo.os.toString(),
      username: document.username
    });

    const authAttempts = await this.insertOne(document);

    return authAttempts[0];
  }

  static async abuseDetected(ip, username) {

    Assert.ok(ip, 'Missing ip argument.');
    Assert.ok(username, 'Missing username argument.');
    const date = new Date();
    const hours = Config.get('/authAttempts/hours');

    date.setHours(date.getHours() - parseInt(hours));

    const [countByIp, countByIpAndUser] = await Promise.all([
      this.count({ ip }),
      this.count({ ip, username, createdAt: { $gte:(date) } })
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
    disabled: true
  },
  update: {
    disabled: true
  },
  delete: {
    disabled: true
  }
});

AuthAttempt.sidebar = {
  name: 'Auth Attempts'
};

AuthAttempt.columns = [
  { headerName: 'Id', field: '_id' },
  { headerName: 'Browser', field: 'browser' },
  { headerName: 'ip', field: 'ip' },
  { headerName: 'os', field: 'os' },
  { headerName: 'Created At', field: 'createdAt' }
];

AuthAttempt.lookups = [];

AuthAttempt.indexes = [
  { key: { ip: 1, username: 1 } },
  { key: { username: 1 } }
];

module.exports = AuthAttempt;
