'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Event extends AnchorModel {

  static async create(doc) {

    Assert.ok(doc.name, 'Missing name argument.');
    Assert.ok(doc.userId, 'Missing userId argument.');

    const document = {
      name: doc.name.toUpperCase(),
      userId: doc.userId,
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

Event.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Joi.object({
      name: Joi.string().required()
    })
  },
  delete: {
    disabled: true
  },
  tableView: {
    outputDataFields: {
      username: {label: 'Username', from: 'user'},
      name: {label: 'Name'},
      time: {label: 'Time'},
      userID: {label: 'User ID'},
      _id: {label: 'ID', accessRoles: ['admin', 'researcher','root'], invisible: true}
    }
  },
  createView: {
    createSchema: Joi.object({
      name: Joi.string().required()
    })
  }
});

Event.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Event.indexes = [
  { key: { name: 1 } },
  { key: { time: 1 } },
  { key: { userId: 1 } }
];


module.exports = Event;
