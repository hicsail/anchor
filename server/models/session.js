'use strict';
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Bcrypt = require('bcrypt');
const Joi = require('joi');
const NewDate = require('joistick/new-date');
const UserAgent = require('useragent');
const UUID = require('uuid/v4');

class Session extends AnchorModel {

  static async create(userId, ip, userAgent) {

    Assert.ok(userId, 'Missing userId argument.');
    Assert.ok(ip, 'Missing ip argument.');
    Assert.ok(userAgent, 'Missing userAgent argument.');

    const keyHash = await this.generateKeyHash();
    const agentInfo = UserAgent.lookup(userAgent);
    const browser = agentInfo.family;
    const document = new this({
      browser,
      ip,
      key: keyHash.hash,
      os: agentInfo.os.toString(),
      userId
    });
    const sessions = await this.insertOne(document);

    sessions[0].key = keyHash.key;

    return sessions[0];
  }

  static async generateKeyHash() {

    const key = UUID();
    const salt = await Bcrypt.genSalt(10);
    const hash = await Bcrypt.hash(key,salt);

    return { key, hash };
  }

  static async findByCredentials(id, key) {

    Assert.ok(id, 'Missing id argument.');
    Assert.ok(key, 'Missing key argument.');

    const session = await this.findById(id);

    if (!session) {
      return;
    }

    const keyMatch = await Bcrypt.compare(key, session.key);

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
  lastActive: Joi.date().default(NewDate(), 'time of last activity'),
  os: Joi.string().required(),
  userId: Joi.string().required(),
  createdAt: Joi.date().default(NewDate(), 'time of creation')
});


Session.indexes = [
  { key: { userId: 1 } }
];


module.exports = Session;
