'use strict';
const Async = require('async');
const DefaultScopes = require('./getRoleNames');
const RouteScope = require('../models/route-scope');

module.exports = (server, callback) => {//initializes the routeScope collection with routes' scope from the server.table()

  if (!server){
    return null;
  }

  const arrRouteData = []; //array of route's scope data to be inserted to the routeScope collection.
  Async.each(server.table()[0].table, (item, done) => {//initialize the routeScope collection from the server.table

    if (item.hasOwnProperty('path')){//processing specifically each routes in server
      let route = {};
      const path = item.path;
      const method = item.method.toUpperCase();

      if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ) {
        route = {
          path,
          method,
          scope: item.settings.auth.access[0].scope.selection
        };
      }
      else {//if no existing scope, assign default scope to route
        route = {
          path,
          method,
          scope: DefaultScopes
        };
      }

      RouteScope.findByPathAndMethod(path, method, (err, routeData) => {//check for existing routes in the database

        if (err) {
          return done(err);
        }
        else if (routeData) { //if the routeData exists within the routeScope collection then just simply update the scope.
          RouteScope.updateScope(path, method, { $set: { scope: route.scope } });
          done();
        }
        else {//push to an array which will then be inserted as a batch into the RouteScope collection.
          arrRouteData.push(route);
          done();
        }
      });
    }
  }, (err) => {

    if (err){
      return callback(err, null);
    }

    if (arrRouteData.length !== 0){//if there are routes to be inserted into database, batch insert the array into the collection.
      RouteScope.insertMany(arrRouteData, (err, result) => {

        if (err){
          return callback(err, null);
        }
        if (result){
          console.log('Updated routeScope table with server.table()');
          callback(null, result);
        }
      });
    }
    else {
      callback('no routes to be updated to server.table()', null);
    }
  });
};
