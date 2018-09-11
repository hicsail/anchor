'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Crypto = require('../crypto');
const Hoek = require('hoek');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const Config = require('../../config');
// const config -> require cookie secret for JWT

class Token extends AnchorModel {

  static async create(document) {

    const keyHash = await Crypto.generateKeyHash();

    document = {
      description: document.description,
      key: keyHash.hash,
      userId: document.userId,
      permissions: document.permissions || {},
      isActive: true
    };

    const token = await this.insertOne(document);
    keyHash.key = JWT.sign(( token[0]._id + ':' + keyHash.key), Config.get('/cookieSecret'));
    token[0].key = keyHash.key;
    return token[0];
  }
}

Token.collectionName = 'tokens';

Token.schema = Joi.object({
  _id: Joi.object(),
  key: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string().required(),
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  lastUsed: Joi.date(),
  lastActive: Joi.date(),
  permission: Joi.object()
});

Token.payload = Joi.object({
  description: Joi.string().required(),
  permission: Joi.any()
});

Token.isActivePayload = Joi.object({
  isActive: Joi.boolean().required()
});

Token.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Token.payload
  },
  update: {
    payload: Token.payload
  }
});

Token.sidebar = {
  name: 'Tokens'
};

Token.columns = [
  {
    headerName: 'Token',
    children: [
      { headerName: 'Id', field: '_id' },
      { headerName: 'Description', field: 'description' },
      { headerName: 'Last Active', field: 'lastActive' },
      { headerName: 'Created At', field: 'createdAt' }
    ]
  },
  {
    headerName: 'User',
    children: [
      { headerName: 'Name', field: 'user.name' },
      { headerName: 'Username', field: 'user.username' },
      { headerName: 'Email', field: 'user.email' }
    ]
  }
];

Token.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Token.indexes = [
  { key: { userId: 1 } }
];

module.exports = Token;
