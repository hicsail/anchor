'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const User = require('./user');
const Hoek = require('hoek');


class Invite extends AnchorModel {

  static async create(doc) {

    Assert.ok(doc.name, 'Missing name argument.');
    Assert.ok(doc.email, 'Missing email argument.');
    Assert.ok(doc.userId, 'Missing userId argument.');

    const document = {
      name: doc.name,
      email: doc.email,
      description: doc.description,
      userId: doc.userId,
      status: 'Pending',
      time: new Date(),
      expiredAt: new Date(new Date().getTime() + 1000 * 86400 * 7) //7 days
    };

    const invites = await this.insertOne(document);

    return invites[0];
  }
}


Invite.collectionName = 'invite';


Invite.schema = Joi.object({
  _id: Joi.object(),
  user: User.payload,
  userId: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  status: Joi.boolean().required(),
  time: Joi.date().required(),
  expiredAt: Joi.date().required()
});


Invite.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Joi.object({
      email: Joi.string().email().lowercase().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('')
    })
  },
  update: {
    payload: Joi.object({
      email: Joi.string().email().lowercase().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('')
    })
  },
  tableView: {
    outputDataFields: {
      username: {label: 'Username', from: 'user'},
      name: {label: 'Name'},
      email: {label: 'Email'},
      description: {label: 'Description'},
      status: {label: 'Status'},
      userId: {label: 'User ID'},
      time: {label: 'Created At'},
      expiredAt: {label: 'Expired At'},
      _id: {label: 'ID', accessRoles: ['admin', 'researcher','root'], invisible: true}
    }
  },
  createView: {
    createSchema: Joi.object({
      email: Joi.string().email().lowercase().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('')
    })
  },
  editView: {
    editSchema: Joi.object({
      email: Joi.string().email().lowercase().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('')
    })
  }
});

Invite.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];


Invite.indexes = [
  { key: { userId: 1 } },
  { key: { status: 1 } }
];


module.exports = Invite;
