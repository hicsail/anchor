'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');
class Analytic extends AnchorModel {

  static async create(document) {

    Assert.ok(document.event, 'Missing event argument');
    Assert.ok(document.name, 'Missing name argument');

    document = new this({
      event: document.event,
      name: document.name,
      data: document.data || {},
      userId: document.userId
    });

    const analytic = await this.insertOne(document);

    return analytic[0];

  }
}

Analytic.collectionName = 'analytics';

Analytic.schema = Joi.object({
  _id: Joi.object(),
  event: Joi.string().required(),
  name: Joi.string().required(),
  data: Joi.object(),
  userId: Joi.string(),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Analytic.payload = Joi.object({
  event: Joi.string().required(),
  name: Joi.string().required(),
  data: Joi.object()
});

Analytic.routes = Hoek.applyToDefaults(AnchorModel.routes, {
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

Analytic.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Analytic.sidebar = {
  name: 'Analytics',
  disabled: true
};

Analytic.indexes = [
  { key: { event: 1 } },
  { key : { name: 1 } }
];

module.exports = Analytic;
