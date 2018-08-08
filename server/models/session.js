'use strict';
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Crypto = require('../crypto');
const Joi = require('joi');
const Hoek = require('hoek');
const UserAgent = require('useragent');


class Session extends AnchorModel {

  static async create(document) {

    Assert.ok(document.userId, 'Missing userId argument.');
    Assert.ok(document.ip, 'Missing ip argument.');
    Assert.ok(document.userAgent, 'Missing userAgent argument.');

    const keyHash = await Crypto.generateKeyHash();
    const agentInfo = UserAgent.lookup(document.userAgent);
    const browser = agentInfo.family;
    document = new this({
      browser,
      ip: document.ip,
      key: keyHash.hash,
      os: agentInfo.os.toString(),
      userId: document.userId
    });
    const sessions = await this.insertOne(document);

    sessions[0].key = keyHash.key;

    return sessions[0];
  }


  static async findByCredentials(id, key) {

    Assert.ok(id, 'Missing id argument.');
    Assert.ok(key, 'Missing key argument.');

    const session = await this.findById(id);

    if (!session) {
      return;
    }

    const keyMatch = await Crypto.compare(key, session.key);

    if (keyMatch) {
      return session;
    }
  }

  async updateLastActive() {

    const update = {
      $set: {
        lastActive: new Date()
      }
    };

    await Session.findByIdAndUpdate(this._id, update);
  }
}

Session.collectionName = 'sessions';

Session.schema = Joi.object({
  _id: Joi.object(),
  browser: Joi.string().required(),
  ip: Joi.string().required(),
  key: Joi.string().required(),
  lastActive: Joi.date().default(new Date(), 'time of last activity'),
  os: Joi.string().required(),
  userId: Joi.string().required(),
  createdAt: Joi.date().default(new Date(), 'time of creation'),
  updatedAt: Joi.date().default(new Date(), 'time of document updated')
});

Session.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: false,
    payload: Session.payload
  },
  update: {
    disabled: false,
    payload: Session.payload
  },
  delete: {
    disabled: false
  }
});

Session.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true,
  lookups: [{
    from: require('./role'),
    local: 'roles',
    foreign: '_id',
    as: 'roles',
    operator: '$in'
  }]
}];

Session.indexes = [
  { key: { userId: 1 } }
];

module.exports = Session;
