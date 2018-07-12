'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Feedback extends AnchorModel {

  static async create(title,description,userId,resolved,comments,message){

    Assert.ok(title,'Missing title');
    Assert.ok(description, 'Missing description');
    Assert.ok(userId,'Missing userid');

    const document =  {
      title,
      description,
      userId,
      resolved: false,
      createdAt: new Date(),
      comments:  {
        message,
        userId,
        createdAt: new Date()
      }

    };


    const feedback =  await this.insert(document);

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
  comments: Joi.object({
    message: Joi.string().required(),
    userId: Joi.string().required(),
    createdAt: Joi.date().required()
  })


});


Feedback.payload = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  resolved: Joi.boolean().required(),
  comments: Joi.object({
    message: Joi.string().required(),
    userId: Joi.string().required(),
    createdAt: Joi.date().required()

  })

});

Feedback.indexes = [
  { key: { title: 1 } }
];





module.exports = Feedback;










