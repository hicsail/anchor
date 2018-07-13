'use strict';
const Joi  = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Role extends AnchorModel {

  static async create(name,permissions,filter) {

    Assert.ok(name, 'Missing name');
    Assert.ok(permissions, 'Missing permissions');
    Assert.ok(filter, 'Missing filter');

    const document = {
      name,
      permissions,
      filter,
      createdAt: new Date()
    };

    const role = await this.insertOne(document);

    return role[0];

  }
}

Role.collectionName = 'role';


Role.schema = Joi.object({
  _id: Joi.string(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  permissions: Joi.object({
    placeholder:Joi.string()
  }),
  filter: Joi.array().items(Joi.object({
    placeholder: Joi.string()
  })),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required()

});


Role.payload = Joi.object({
  name: Joi.string().required(),
  userId: Joi.string().required(),
  permissions: Joi.object({
    placeholder: Joi.string()
  }),
  filter: Joi.array().items(Joi.object({
    placeholder: Joi.string()
  }))

});

Role.indexes = [
  { key: { name: 1 }  }];


module.exports = Role;
