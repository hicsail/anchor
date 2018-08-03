'use strict';
const Joi  = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');
const ObjectId = require('mongodb').ObjectID;

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

  static async updateRole(filter,update,namechange) {

    const role = await this.updateOne(
      { _id: ObjectId(filter) },
      { $set: { 'permissions' : update,
        'name': namechange } }
    );
    return role;
  }
}



Role.collectionName = 'roles';


Role.schema = Joi.object({
  _id: Joi.object(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  permissions: Joi.object().required(),
  filter: Joi.array(),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Role.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: false,
    payload: Role.payload
  },
  update: {
    disabled: false,
    payload: Role.payload
  },
  delete: {
    dsiabled:false
  }
});


Role.payload = Joi.object({
  name: Joi.string().required(),
  permissions: Joi.object().required(),
  filter: Joi.array()
});

Role.indexes = [
  { key: { name: 1, unique: 1 } }
];


module.exports = Role;
