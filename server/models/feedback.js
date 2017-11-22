'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');


class Feedback extends MongoModels {

  static create(subject,description, userId, callback) {

    const document = {
      subject,
      description,
      userId,
      resolved: false,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Feedback.collection = 'feedback';


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


Feedback.indexes = [
  { key: { name: 1 } },
  { key: { time: 1 } },
  { key: { userId: 1 } }
];


module.exports = Feedback;
