'use strict';
const Assert = require('assert');
const Config = require('../../config');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const AnchorModel = require('../anchor/anchor-model');

class Token extends AnchorModel {

  static async create(tokenName, userId) {

    Assert.ok(tokenName, 'Missing tokenName arugment.');
    Assert.ok(userId, 'Missing userId arugment.');    

    const id = AnchorModel.ObjectID().toString();

    const document = {
      tokenName,
      userId,
      token: JWT.sign(id,Config.get('/authSecret')),
      tokenId: id,
      time: new Date(),
      active: true,
      lastUsed: null
    };
   
    const tokens = await this.insertOne(document);    

    return tokens[0];   
  }
}


Token.collectionName = 'tokens';


Token.schema = Joi.object({
  _id: Joi.object(),
  tokenName: Joi.string().required(),
  userId: Joi.boolean().required(),
  token: Joi.string().required(),
  time: Joi.date().required(),
  active: Joi.boolean().required(),
  lastUsed: Joi.date().required()
});

Token.payload = Joi.object({
  tokenName: Joi.string().required(),
  active: Joi.boolean().default(true)
});


Token.indexes = [
  { key: { tokenId: 1 } },
  { key: { userId: 1 } }
];


module.exports = Token;
