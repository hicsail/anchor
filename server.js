'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfigTable');
const Fs = require('fs');
const DefaultScopes = require('./server/helpers/getRoleNames');
const RouteScope = require('./server/models/route-scope');
const Async = require('async');
const GetRoutes = require('./server/helpers/getRoutes');

Composer( (err, server) => {

  if (err) {
    throw err;
  }

  GetRoutes('database');

  server.start(() => {

    if (!Fs.existsSync('server/permission-config.json')){//initialized the permission config file if it doesn't already exist
      InitPC(server);
    }

    //initialize the routeScope table from the server.table
    const arrRouteData = []; //array of route's scope data to be inserted to the routeScope table.

    Async.each(server.table()[0].table, (item, callback) => {

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

        RouteScope.findByPathAndMethod(path, method, (err, routeData) => {

          if (err) {
            callback(err);
          }
          else if (routeData) { //if the routeData exists within the routeScope table then just simply update the scope.
            RouteScope.updateScope(path, method, { $set: { scope: route.scope } });
            callback();
          }
          else {//push to an array which will then be inserted as a batch into the RouteScope table.
            arrRouteData.push(route);
            callback();
          }
        });
      }
    }, (err) => {

      if (err){
        throw err;
      }

      if (arrRouteData.length !== 0){
        RouteScope.insertMany(arrRouteData, (err, result) => {

          if (err){
            throw err;
          }
          if (result){
            console.log('Updated routeScope table with server.table()');
          }
        });
      }
    });
    console.log('Started the plot device on port ' + server.info.port);
  });
});
