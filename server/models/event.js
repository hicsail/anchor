'use strict';
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');


class Event extends AnchorModel {

  static create(name, userId, callback) {

    const document = {
      name: name.toUpperCase(),
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


Event.collectionName = 'events';


Event.schema = Joi.object({
  _id: Joi.object(),
  name: Joi.string().required(),
  userId: Joi.boolean().required(),
  time: Joi.date().required()
});

Event.payload = Joi.object({
  name: Joi.string().required()
});


Event.indexes = [
  { key: { name: 1 } },
  { key: { time: 1 } },
  { key: { userId: 1 } }
];


module.exports = Event;
