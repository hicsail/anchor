'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Notification extends AnchorModel {

  static async create(document) {

    Assert.ok(document.oneSignalId,'Missing onesignal id');
    Assert.ok(document.PlayerIds, 'Missing playerids');
    Assert.ok(document.title,'Missing title');
    Assert.ok(document.subtitle,'Missing subtitle');
    Assert.ok(document.message,'Missing message');
    Assert.ok(document.increaseBageNumber, 'Missing increase bage number');

    document = {
      oneSignalId: document.oneSignalId,
      PlayerIds: document.PlayerIds,
      title: document.title,
      subtitle: document.subtitle,
      message: document.message,
      increaseBageNumber: document.increaseBageNumber,
      deliveryAt: null,
      deliveredAt: null
    };

    const notification = await this.insertOne(document);

    return notification[0];
  }

}

Notification.schema = Joi.object({
  _id: Joi.object(),
  oneSignalId: Joi.string().required(),
  PlayerIds: Joi.array().items(Joi.string().required()),
  title: Joi.string(),
  subtitle: Joi.string().required(),
  message: Joi.string().required(),
  increaseBageNumber: Joi.number().integer().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
  deliveryAt: Joi.date().required(),
  deliveredAt: Joi.date().required(),
  openedAt: Joi.date().required()
});

Notification.payload = Joi.object({
  oneSignalId: Joi.string().required(),
  PlayerIds: Joi.array().items(Joi.string()),
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  message: Joi.string().required(),
  increaseBageNumber: Joi.number().integer().required()

});

Notification.indexes = [
  { key: { title: 1 } }
];

module.exports = Notification;



