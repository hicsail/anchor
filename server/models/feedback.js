'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');


class Feedback extends AnchorModel {

  static async create(document){

    Assert.ok(document.title,'Missing title');
    Assert.ok(document.description, 'Missing description');
    Assert.ok(document.userId,'Missing userid');

    document =  {
      title: document.title,
      description: document.description,
      userId: document.userId,
      resolved: false,
      comments: []
    };

    const feedback =  await this.insertOne(document);

    return feedback[0];
  }
}


Feedback.collectionName = 'feedbacks';


Feedback.schema = Joi.object({
  _id: Joi.object(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  userId: Joi.string().required(),
  resolved: Joi.boolean().default(false),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  comments: Joi.array().items(Joi.object({
    message: Joi.string().required(),
    userId: Joi.string().required(),
    createdAt: Joi.date().required()
  }))
});


Feedback.payload = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required()
});

Feedback.indexes = [
  { key: { title: 1 } }
];





module.exports = Feedback;










