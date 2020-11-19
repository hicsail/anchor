'use strict';
const Fs = require('fs');
const PermissionConfigTable = require('../permission-config.json');
const RouteScope = require('../models/route-scope');

const register = function (server, options) {

  server.route({
    method: 'PUT',
    path: '/api/users/scopes',
    options: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: RouteScope.payload
      }
    },
    handler: async function (request, h) {
      //update scope of route
      const scopesArray = PermissionConfigTable[request.payload.method][request.payload.path];
      if (scopesArray.includes(request.payload.scope)){
        scopesArray.splice(scopesArray.indexOf(request.payload.scope), 1);
      }
      else {
        scopesArray.push(request.payload.scope);
      }

      const condition = {
        path: request.payload.path,
        method: request.payload.method
      };

      const update = { $set: { scope: scopesArray } };

      const route = await RouteScope.findOneAndUpdate(condition, update);

      //if there doesn't already exist a document with method and path, insert a document
      if (!route) {

        const doc = {
          method: request.payload.method,
          path: request.payload.path,
          scope: scopesArray
        };

        await RouteScope.create(doc);
      }

      if (!PermissionConfigTable.hasOwnProperty(request.payload.method)) {
        PermissionConfigTable[request.payload.method] = {};
      }

      PermissionConfigTable[request.payload.method][request.payload.path] = scopesArray;
      //console.log("scopesArray", scopesArray)

      Fs.writeFileSync('server/permission-config.json', JSON.stringify(PermissionConfigTable, null, 2));


      /*const injectOptions = {
        method: 'POST',
        url: '/api/users/scopeCheck',
        payload: {
          method: request.payload.method,
          path: request.payload.path
        }
     }
      const res = await server.inject(injectOptions);
      console.log("resr.result", res.payload); */

      return true;
    }
  });

  server.route({
    method: 'POST',
    path: '/api/users/scopeCheck',
    options: {
      auth: {
        strategy: 'session'
        //scope: PermissionConfigTable.POST['/api/users/scopeCheck'] || DefaultScopes
      }
    },
    handler: function (request, h){

      console.log('hereeee');

      const route = server.table().find( (item) => {

        return item.path === request.payload.path && item.method.toUpperCase() === request.payload.method;
      });

      if (route) {

        const path = route.path;
        const method = route.method.toUpperCase();
        const set = new Set();
        PermissionConfigTable[method][path].forEach((scope) => {

          set.add(scope);
        });
        if (route.settings.auth && route.settings.auth.access && route.settings.auth.access[0].scope.selection.length === set.size){
          const configurableScope = route.settings.auth.access[0].scope.selection.every((scope) => {

            return set.has(scope);
          });
          if (configurableScope) {
            return 'Updated Route\'s Scope';
          }
        }
        return 'Unable to Update Route\'s scope';
      }

      return 'specified route: ' + request.payload.path + ' ' + request.payload.method + ' not found';
    }
  });
};

module.exports = {
  name: 'routeScopes',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
