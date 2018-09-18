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
    Assert.ok(document.message,'Missing message');
    Assert.ok(document.data,'Missing data');
    Assert.ok(document.deliveryAt, 'Missing deliveryAt');

    document = {
      onesignalId: document.onesignalId,
      playerIds: document.playerIds,
      title: document.title,
      message: document.message,
      data: document.data,
      deliveryAt: document.deliveryAt
    };

    const notification = await this.insertOne(document);

    return notification[0];
  }
}

Notification.collectionName = 'notfications';

Notification.schema = Joi.object({
  _id: Joi.object(),
  userId: Joi.string(),
  onesignalId: Joi.string().required(),
  playerIds: Joi.array().items(Joi.string().required()),
  title: Joi.string(),
  message: Joi.string().required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  deliveryAt: Joi.date(),
  deliveredAt: Joi.date(),
  openedAt: Joi.date()
});

Notification.payload = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  deliveryAt: Joi.date().required(),
  data: Joi.object().default({})
});

Notification.routes = Hoek.applyToDefaults(AnchorModel.routes, {});

Notification.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Notification.sidebar = {
  name: 'Notifications',
  disabled: true
};

Notification.indexes = [
  { key: { title: 1 } }
];

module.exports = Notification;
