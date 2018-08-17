'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');
class Invite extends AnchorModel {
  static async create(document) {


    Assert.ok(document.email, 'Email missing');
    Assert.ok(document.status,'Status missing');

    document = {
      email: document.email,
      status: document.status
    };

    const invite = await this.insertOne(document);
    return invite[0];
  }
}

Invite.collectionName = 'invites';


Invite.schema = Joi.object({
  _id: Joi.object(),
  email: Joi.string().required(),
  userId: Joi.string(),
  expiredAt: Joi.date(),
  status: Joi.string().valid('Pending','Accepted','Declined','Expired'),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Invite.payload = Joi.object({
  email: Joi.string().required(),
  status: Joi.string().valid('Pending','Accepted','Declined','Expired')
});

Invite.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: false,
    payload: Invite.payload
  },
  update: {
    disabled: false,
    payload: Invite.payload
  },
  delete: {
    disabled: false
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
  { key: { email: 1 }  }
];


module.exports = Invite;

