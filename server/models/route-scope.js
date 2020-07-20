'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');
const DefaultRoles = require('../helpers/getDefaultRoles');

class RouteScope extends MongoModels{ //TODO: write the corresponding methods for the RouteScope model

  static updateScope(path, method, newScope) {//update the routeScope collection in the database

    const condition = {
      path,
      method
    };
    this.updateOne(condition, { scope: newScope }, (err, result) => {

      if (err){
        throw err;
      }
      return result;
    });
  }

  static delete(){//delete the routeScope collection in the database

  }

  static findByPath(path){//returns an array of object routes with the specified path along with its respective method and scope

    const condition = {
      path
    };
    this.find(condition, (err, routes) => {

      if (err){
        throw err;
      }
      return routes;
    });
  }

  static findByMethod(method){//returns an array of object routes with the specified method along with its respective path and scope

    const condition = {
      method
    };
    this.find(condition, (err, routes) => {

      if (err){
        throw err;
      }
      return routes;
    });
  }

  static findByPathAndMethod(path, method, callback) {//returns the scope of the specified path and method.

    const condition = {
      path,
      method
    };
    this.findOne(condition, (err, route) => {

      if (err){
        callback(err);
      }
      callback(route);
    });
  }

  static insert(routeData) {//create a fresh new collection in the database

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
  path: Joi.string().required(),//TODO: tighten the schema of the path to follow its pattern
  date: Joi.date().required()
});


module.exports = RouteScope;
