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
      active: true,
      createdAt: new Date(),
      key:keyHash.hash,
      userId: document.userId
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
  active: Joi.boolean().default(true),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  lastUsed: Joi.date(),
  permission: Joi.object()
});

Token.payload = Joi.object({
  userId: Joi.string().required(),
  description: Joi.string().required(),
  active: Joi.boolean(),
  permission: Joi.object()
});

Token.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: false,
    payload: Token.payload
  },
  update: {
    auth: true,
    payload: Token.payload
  },
  delete: {
    disabled: false
  }
});

Token.indexes = [
  { key: { userId: 1 } }
];

module.exports = Token;
