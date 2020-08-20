'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');
const DefaultRoles = require('../helpers/getRoleNames');

class RouteScope extends MongoModels{

  static updateScope(path, method, newScope) {//update the routeScope collection in the database

    const condition = {
      path,
      method
    };
    this.updateOne(condition, newScope, (err, result) => {

      if (err){
        throw err;
      }
      return result;
    });
  }

  static findByPathAndMethod(path, method, callback) {//returns the scope of the specified path and method.

    const condition = {
      path,
      method
    };
    this.findOne(condition, (err, route) => {

      if (err){
        return callback(err);
      }
      callback(null, route);
    });
  }

  static insert(routeData) {//create a new document in the database containing route scope details

    return this.insertOne(routeData, (err, result) => {

      if (err) {
        throw err;
      }
      return result;
    });
  }
}

RouteScope.collection = 'routeScope';

RouteScope.schema = Joi.object({
  _id: Joi.string(),
  method: Joi.string().required().uppercase(),
  scopes: Joi.array().required().max(DefaultRoles.length).min(1),
  path: Joi.string().required(),
  date: Joi.date().required()
});


module.exports = RouteScope;
