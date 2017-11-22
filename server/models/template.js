/* $lab:coverage:off$ */
'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class Template extends MongoModels {

  static create(name, userId, callback) {

    const document = {
      name,
      userId,
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


Template.collection = 'templates';


Template.schema = Joi.object({
  _id: Joi.object(),
  name: Joi.string().required(),
  userId: Joi.boolean().required(),
  time: Joi.date().required()
});

Template.payload = Joi.object({
  name: Joi.string().required()
});



Template.indexes = [
  { key: { name: 1 } },
  { key: { userId: 1 } }
];


module.exports = Template;
/* $lab:coverage:on$ */
