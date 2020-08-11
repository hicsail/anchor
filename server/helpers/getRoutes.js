'use strict';
const PermissionConfigTable = require('../permission-config.json');
const DefaultScopes = require('../helpers/getRoleNames');
const RouteScope = require('../models/route-scope');

module.exports = (flag, server = null) => {//method for getting route information from different sources depending on flag. If flag is not "server" the second parameter should be null.

  let routes = {};
  switch (flag){
  case 'server':
    if (!server){
      throw 'server flag with no server data';
    }
    server.table()[0].table.forEach((item) => {

      if (item.hasOwnProperty('path')){//processing routes in server
        const path = item.path;
        const method = item.method.toUpperCase();
        if (!routes.hasOwnProperty(method)){
          routes[method] = {};
        }
        if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
          routes[method][path] = item.settings.auth.access[0].scope.selection;
        }
        else {//routes don't have scope, assign default value to each route
          routes[method][path] = DefaultScopes;
        }
      }
    });
    break;
  case 'permission-config':
    routes = PermissionConfigTable;
    break;
  case 'database':
    RouteScope.find({}, (err, result) => {

      if (err){
        throw err;
      }
      result.forEach((routeDoc) => {

        if (!routes.hasOwnProperty(routeDoc.method)){
          routes[routeDoc.method] = {};
        }
        routes[routeDoc.method][routeDoc.path] = routeDoc.scope;
      });
    });
    break;
  }
  return routes;
};
