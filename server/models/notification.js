'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Notification extends AnchorModel {

  static async create(document) {

    Assert.ok(document.onesignalId,'Missing onesignalId');
    Assert.ok(document.playerIds, 'Missing playerIds');
    Assert.ok(document.title,'Missing title');
    Assert.ok(document.subtitle,'Missing subtitle');
    Assert.ok(document.message,'Missing message');

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

Notification.indexes = [
  { key: { title: 1 } }
];

module.exports = Notification;



