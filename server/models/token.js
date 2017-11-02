'use strict';
const Config = require('../../config');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const MongoModels = require('hicsail-mongo-models');

class Token extends MongoModels {

  static create(tokenName, userId,callback) {

    const id = MongoModels.ObjectID().toString();
    const document = {
      tokenName,
      userId,
      token: JWT.sign(id,Config.get('/authSecret')),
      tokenId: id,
      time: new Date(),
      active: true,
      lastUsed: null
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Token.collection = 'tokens';


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
