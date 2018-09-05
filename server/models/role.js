'use strict';
const Joi  = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Role extends AnchorModel {

  static async create(document) {

    Assert.ok(document.name, 'Missing name');
    Assert.ok(document.permissions, 'Missing permissions');
    Assert.ok(document.filter, 'Missing filter');
    Assert.ok(document.userId, 'Missing userId');

    document = {
      name: document.name,
      permissions: document.permissions,
      filter: document.filter,
      userId: document.userId
    };

    const role = await this.insertOne(document);

    return role[0];

  }

}

Role.collectionName = 'roles';

Role.schema = Joi.object({
  _id: Joi.object(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  permissions: Joi.object().required(),
  filter: Joi.array().items(Joi.object({
    collectionName: Joi.string(),
    field: Joi.string(),
    operator: Joi.string()
  })),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Role.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: true
  },
  update: {
    disabled: true
  }
});

Role.lookups = [];

Role.payload = Joi.object({
  name: Joi.string().required(),
  permissions: Joi.object().required(),
  filter: Joi.array().items(Joi.object({
    collectionName: Joi.string(),
    field: Joi.string(),
    operator: Joi.string()
  }))
});

Role.indexes = [
  { key: { name: 1, unique: 1 } }
];

module.exports = Role;
