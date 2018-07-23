'use strict';
const Joi = require('joi');
const AnchorModels = require('../anchor/anchor-model');
const JWT = require('jsonwebtoken');
const UUID = require('uuid/v4');
const Bcrypt = require('bcrypt');



class Token extends AnchorModels {

  static async generateKeyHash() {

    const key = UUID();
    const salt = await Bcrypt.gensalt(10);
    const hash = await Bcrypt.hash(key,salt);

    const signedKeyHash = JWT.sign({ key:hash });
    const token = JWT.sign({ key });

    return (signedKeyHash,token);
  }

  static async create(document) {

    const signedToken = await this.generateKeyHash()[0];
    document = {
      description: document.description,
      active: true,
      createdAt: new Date(),
      signedToken





    };

    const token = await this.insertOne(document);


    return token[0];

  }






}

Token.collectionName = 'tokens';

Token.schema = Joi.object({
  _id: Joi.object(),
  userId: Joi.string().required(),
  description: Joi.string().required(),
  active: Joi.boolean().default(true),
  key: Joi.string().required(),
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





module.exports = Token;
