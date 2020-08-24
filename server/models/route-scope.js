'use strict';
const Assert = require('assert');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');
const DefaultRoles = require('../helper/getRoleNames');

class RouteScope extends AnchorModel{

  static async updateScope(path, method, newScope) {

    const condition = {
      path,
      method
    };

    const result = await this.updateOne(condition, newScope);
    return result;    
  }

  static async findByPathAndMethod(path, method) {

    const condition = {
      path,
      method
    };
    
    const route = await this.findOne(condition);

    return route;    
  }

  static async create(doc) {

    Assert.ok(doc.path, 'Missing path arugment.');
    Assert.ok(doc.method, 'Missing method arugment.');
    Assert.ok(doc.scope, 'Missing scope arugment.'); 

    const document = {
      path: doc.path,
      method: doc.method,
      scope: doc.scope,      
      createdAt: new Date()      
    };    
   
    const results = await this.insertOne(document);

    return results[0];    
  }
}

RouteScope.collectionName = 'routeScopes';

RouteScope.schema = Joi.object({
  _id: Joi.string(),
  method: Joi.string().required().uppercase(),
  scopes: Joi.array().required().max(DefaultRoles.length).min(1),
  path: Joi.string().required(),
  createdAt: Joi.date().required()
});

RouteScope.payload = Joi.object({
  method: Joi.string().valid('PUT', 'POST', 'DELETE', 'GET').required(),
  path: Joi.string().required(),
  scope: Joi.string().valid(...DefaultRoles).required()   
});

module.exports = RouteScope;