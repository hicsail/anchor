'use strict';
const DefaultScopes = require('./getRoleNames');

module.exports = (server) => {

  const routes = {};
  server.table()[0].table.forEach((item) => {//fills up the routes object with the routes from server

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
  return routes;
};
