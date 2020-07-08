'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');


class Event extends AnchorModel {

  static async create(name, userId) {

    Assert.ok(name, 'Missing name argument.');    
    Assert.ok(userId, 'Missing userId argument.');

    const document = {
      name: name.toUpperCase(),
      userId,
      time: new Date()
    };

    const events = await this.insertOne(document);   

    return events[0];    
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
