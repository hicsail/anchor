'use strict';
const Assert = require('assert');
const Config = require('../../config');
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Token extends AnchorModel {

  static async create(doc) {

    Assert.ok(doc.tokenName, 'Missing tokenName arugment.');
    Assert.ok(doc.userId, 'Missing userId arugment.');    

    const id = AnchorModel.ObjectID().toString();

    const document = {
      tokenName: doc.tokenName,
      userId: doc.userId,
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

Token.routes = Hoek.applyToDefaults(AnchorModel.routes, {   
  create: {
    payload: {      
      tokenName: Joi.string().required(),
      active: Joi.boolean().default(true)   
    } 
  },
  update: {
    payload: {      
      tokenName: Joi.string().required(),
      active: Joi.boolean().default(true)   
    }    
  },
  tableView: {
    outputDataFields: {
      username: {label: 'Username', from: 'user'},
      name: {label: 'name', from: 'user'},
      tokenName: {label: 'Token Name'},
      active: {label: 'Active'},
      lastUsed: {label: 'Last Used'},
      time: {label: 'Time'},
      token: {label: 'Token', invisible: true},
      _id: {label: 'ID', invisible: true}
    }
  },
  createView: {
    createSchema: { 
      tokenName: 'string:required'
    }
  }   
});

Token.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true               
}]; 

Token.constraints = [{
  foreignKey: 'userId',
  parentTable: require('./user'),
  onDelete: 'CASCADE'
}]


Token.indexes = [
  { key: { tokenId: 1 } },
  { key: { userId: 1 } }
];


module.exports = Token;
