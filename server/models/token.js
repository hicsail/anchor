'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Bcrypt = require('bcrypt');
const Hoek = require('hoek');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const UUID = require('uuid/v4');


class Token extends AnchorModel {

  static async generateKeyHash() {

    const key = JWT.sign({ key: UUID() }, 'secret');
    const salt = await Bcrypt.genSalt(10);
    const hash = await Bcrypt.hash(key,salt);

    const signedKeyHash = JWT.sign({ key:hash },'secret');


    return (signedKeyHash);
  }

  static async create(document) {

    const keyHash = await this.generateKeyHash();
    document = {
      description: document.description,
      active: true,
      createdAt: new Date(),
      token:keyHash,
      userId: document.userId







    };

    const token = await this.insertOne(document);
    token[0].key = keyHash.key;

    return token[0];

  }
}

Token.collectionName = 'tokens';

Token.schema = Joi.object({
  _id: Joi.object(),
  token: Joi.string().required(),
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
  active: Joi.boolean().required(),
  permission: Joi.object()
});

Token.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: true
  },
  update: {
    payload: Token.payload
  }
});

Token.indexes = [
  { key: { userId: 1 } }
];

module.exports = Token;
