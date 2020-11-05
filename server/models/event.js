'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

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

Event.routes = Hoek.applyToDefaults(AnchorModel.routes, {
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
