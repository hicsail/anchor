'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');
const DefaultRoles = require('../helpers/getDefaultRoles');

class RouteScope extends MongoModels{ //TODO: write the corresponding methods for the RouteScope model

  static update(data){//update the routeScope collection in the database

  }

  static delete(){//delete the routeScope collection in the database

  }

  static findByPath(path){//returns an array of object routes with the specified path along with its respective method and scope

  }

  static findByMethod(method){//returns an array of object routes with the specified method along with its respective path and scope

  }

  static findByPathAndMethod(path, method){//returns the scope of the specified path and method.

  }

  static create(server, callback){//create a fresh new collection in the database

    const doc = {
    };
    this.insertOne(doc, (err, res) => {

      if (err){
        callback(err);
      }
      callback(res);
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
