'use strict';
const Assert = require('assert');
const Crypto = require('../crypto');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');
const UserAgent = require('useragent');
const Hoek = require('hoek');
//const Uuid = require('uuid');


class Session extends AnchorModel {

  static async create(userId, ip, userAgent) {
    
    Assert.ok(userId, 'Missing userId argument.');
    Assert.ok(ip, 'Missing ip argument.');
    Assert.ok(userAgent, 'Missing userAgent argument.');

    const keyHash = await Crypto.generateKeyHash();
    const agentInfo = UserAgent.lookup(userAgent);
    const browser = agentInfo.family;

    const document = {
      userId,
      key: keyHash.hash,
      time: new Date(),
      lastActive: new Date(),
      ip,
      browser,
      os: agentInfo.os.toString()
    };

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
  userId: Joi.string().required(),
  key: Joi.string().required(),
  time: Joi.date().required(),
  lastActive: Joi.date().required(),
  ip: Joi.string().required(),
  browser: Joi.string().required(),
  os: Joi.string().required()
});

Session.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: false               
}];

Session.indexes = [
  { key: { userId: 1, application: 1 } }
];


module.exports = Session;
