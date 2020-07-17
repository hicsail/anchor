'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class RouteScope extends MongoModels{
  static createTable(server, callback){

    const doc = {
      testing: 'Louis'
    };
    this.insertOne(doc, (err, res) => {

      if (err){
        callback(err);
      }
      callback(res);
    });
  }
}

RouteScope.collection = 'permissionConfig';

RouteScope.schema = Joi.object({
  _id: Joi.object(),
  subject: Joi.string().required(),
  description: Joi.string().required(),
  userId: Joi.string().required(),
  resolved: Joi.boolean().required(),
  time: Joi.date().required()
});


module.exports = RouteScope;
