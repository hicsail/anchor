'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Notification extends AnchorModel {

  static async create(document) {

    Assert.ok(document.onesignalId,'Missing onesignalId');
    Assert.ok(document.playerIds, 'Missing playerIds');
    Assert.ok(document.title,'Missing title');
    Assert.ok(document.subtitle,'Missing subtitle');
    Assert.ok(document.message,'Missing message');
    Assert.ok(document.increaseBadgeNumber, 'Missing badge number');

    document = {
      onesignalId: document.onesignalId,
      playerIds: document.playerIds,
      title: document.title,
      subtitle: document.subtitle,
      message: document.message,
      increaseBadgeNumber: document.increaseBadgeNumber
    };

    const notification = await this.insertOne(document);

    return notification[0];
  }
}

Notification.collectionName = 'notfications';

Notification.schema = Joi.object({
  _id: Joi.object(),
  onesignalId: Joi.string().required(),
  playerIds: Joi.array().items(Joi.string().required()),
  title: Joi.string(),
  subtitle: Joi.string().required(),
  message: Joi.string().required(),
  increaseBadgeNumber: Joi.number().integer().required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  deliveryAt: Joi.date(),
  deliveredAt: Joi.date(),
  openedAt: Joi.date()
});

Notification.payload = Joi.object({
  oneSignalId: Joi.string().required(),
  PlayerIds: Joi.array().items(Joi.string()),
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  message: Joi.string().required(),
  increaseBadgeNumber: Joi.number().integer().required()
});

Notification.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: false,
    payload: Notification.payload
  },
  update: {
    disabled: false,
    payload: Notification.payload
  },
  delete: {
    disabled: false
  }
});

Notification.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Notification.indexes = [
  { key: { title: 1 } }
];

module.exports = Notification;
