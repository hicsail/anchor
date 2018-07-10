'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Analytic extends AnchorModel {

  static async create(event,name,data,userId) {


    Assert.ok(event, 'Missing event argument');
    Assert.ok(name, 'Missing name argument');
    Assert.ok(data, 'Missing data arugment');
    Assert.ok(userId, 'Missing userId argument');

    const document = new this({
      event,
      name,
      data,
      userId,
      createdAt: new Date()

    });

    const analytics = await this.insertOne(document);

    return analytics[0];

  }
}

Analytic.collectionName = 'analytics';

Analytic.schema = Joi.object({
  _id: Joi.object(),
  event: Joi.string(),
  name: Joi.string(),
  data: Joi.object(),
  userId: Joi.string(),
  createdAt: new Date()


});

Analytic.payload = Joi.object({
  event: Joi.string(),
  name: Joi.string(),
  data: Joi.object()
});

Analytic.indexes = [
  { key: { event: 1 } },
  { key : { name: 1 } }
];

module.exports = Analytic;


