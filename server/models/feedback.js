'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Feedback extends AnchorModel {

  static async create(subject,description, userId) {

    Assert.ok(subject,'Missing subject');
    Assert.ok(description, 'Missing description');
    Assert.ok(userId,'Missing userid');

    const document = {
      subject,
      description,
      userId,
      resolved: false,
      time: new Date()
    };

    const feedback =  await this.insertOne(document);

    return feedback[0];
  }
}


Feedback.collectionName = 'feedback';


Feedback.schema = Joi.object({
  _id: Joi.object(),
  subject: Joi.string().required(),
  description: Joi.string().required(),
  userId: Joi.string().required(),
  resolved: Joi.boolean().required(),
  time: Joi.date().required()
});

Feedback.payload = Joi.object({
  subject: Joi.string().required(),
  description: Joi.string().required()
});

Feedback.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  update: {
    disabled: true
  }
});

Feedback.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: false
}];

Feedback.indexes = [
  { key: { name: 1 } },
  { key: { time: 1 } },
  { key: { userId: 1 } }
];


module.exports = Feedback;
