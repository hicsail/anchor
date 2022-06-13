'use strict';
const Assert = require('assert');
const Crypto = require('../crypto');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');
const UserAgent = require('useragent');
const Hoek = require('hoek');
//const Uuid = require('uuid');

class Session extends AnchorModel {

  static async create(doc) {

    Assert.ok(doc.userId, 'Missing userId argument.');
    Assert.ok(doc.ip, 'Missing ip argument.');
    Assert.ok(doc.userAgent, 'Missing userAgent argument.');

    const keyHash = await Crypto.generateKeyHash();
    const agentInfo = UserAgent.lookup(doc.userAgent);
    const browser = agentInfo.family;

    const document = {
      userId: doc.userId,
      key: keyHash.hash,
      time: new Date(),
      lastActive: new Date(),
      ip: doc.ip,
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
  userAgent: Joi.string().required(),
  key: Joi.string().required(),
  time: Joi.date().required(),
  lastActive: Joi.date().required(),
  ip: Joi.string().required(),
  browser: Joi.string().required(),
  os: Joi.string().required()
});

Session.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Joi.object({
      userId: Joi.string().required(),
      userAgent: Joi.string().required(),
      key: Joi.string().required(),
      time: Joi.date().required(),
      lastActive: Joi.date().required(),
      ip: Joi.string().required(),
      browser: Joi.string().required(),
      os: Joi.string().required()
    })
  },
  updated: {
    payload: Joi.object({
      userId: Joi.string().required(),
      userAgent: Joi.string().required(),
      key: Joi.string().required(),
      time: Joi.date().required(),
      lastActive: Joi.date().required(),
      ip: Joi.string().required(),
      browser: Joi.string().required(),
      os: Joi.string().required()
    })
  },
  tableView: {
    outputDataFields: {
      userId: { label: 'User ID' },
      userAgent: { label: 'User Agent', invisible: true },
      time: { label: 'Time' },
      lastActive: { label: 'Last Active' },
      ip: { label: 'IP' },
      browser: { label: 'Browser' },
      os: { label: 'OS' },
      key: { label: 'Key', invisible: true },
      _id: { label: 'ID', accessRoles: ['admin', 'researcher','root'], invisible: true }
    }
  },
  createView: {
    createSchema: Joi.object({
      userId: Joi.string().required(),
      userAgent: Joi.string().required(),
      key: Joi.string().required(),
      time: Joi.date().required(),
      lastActive: Joi.date().required(),
      ip: Joi.string().required(),
      browser: Joi.string().required(),
      os: Joi.string().required()
    })
  },
  editView: {
    editSchema: Joi.object({
      userId: Joi.string().required(),
      userAgent: Joi.string().required(),
      key: Joi.string().required(),
      time: Joi.date().required(),
      lastActive: Joi.date().required(),
      ip: Joi.string().required(),
      browser: Joi.string().required(),
      os: Joi.string().required()
    })
  }
});

Session.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Session.indexes = [
  { key: { userId: 1, application: 1 } }
];


module.exports = Session;
