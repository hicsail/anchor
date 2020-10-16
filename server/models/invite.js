'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const User = require('./user');
const Hoek = require('hoek');


class Invite extends AnchorModel {

  static async create(name, email, description, userId) {

    Assert.ok(name, 'Missing name argument.');
    Assert.ok(email, 'Missing email argument.');
    Assert.ok(description, 'Missing description argument.');
    Assert.ok(userId, 'Missing userId argument.');

    const document = {
      name,
      email,
      description,
      userId,
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
  status: Joi.boolean().required(),
  time: Joi.date().required()
});

Invite.payload = Joi.object({
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().required(),
  description: Joi.string().optional()
});


Invite.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: true
  },
  update: {
    payload: {
      email: Joi.string().email().lowercase().required(),
      name: Joi.string().required(),
      description: Joi.string().optional()
    }
  }
});

Invite.lookups = [{
  from: User,
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: false
}];


Invite.indexes = [
  { key: { userId: 1 } },
  { key: { status: 1 } }
];


module.exports = Invite;
