'use strict';
const MongoModels = require('hicsail-mongo-models');

class PermissionConfig extends MongoModels{
  static createTable(server, callback){

    const doc = {
      testing: 'Louis'
    };
    this.insertOne(doc, (err, res) => {

      if (err){
        console.log('err');
        callback(err);
      }
      callback(res);
    });
  }
}

PermissionConfig.collection = 'permissionConfig';

module.exports = PermissionConfig;
