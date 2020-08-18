'use strict';
const PermissionConfigTable = require('../permission-config.json');
const RouteScope = require('../models/route-scope');
const GetServerRoutes = require('./getServerRoutes');

module.exports = (flag, server = null, callback) => {//method for getting route information from different sources depending on flag. If flag is not "server" the second parameter should be null.

  let routes = {};
  switch (flag){
  case 'server':
    if (!server){//if getting from the server, must include the second parameter containing the server.
      throw 'server flag with no server data';
    }
    routes = GetServerRoutes(server);
    callback(routes);
    break;
  case 'permission-config':
    routes = PermissionConfigTable;
    callback(routes);
    break;
  case 'database':
    RouteScope.find({}, (err, result) => {//finds all routes in routeScope collection

      if (err){
        throw err;
      }
      result.forEach((routeDoc) => {//fill up the routes object with routes from the db.

        if (!routes.hasOwnProperty(routeDoc.method)){
          routes[routeDoc.method] = {};
        }
        routes[routeDoc.method][routeDoc.path] = routeDoc.scope;
      });
      callback(routes);
    });
    break;
  }
};
