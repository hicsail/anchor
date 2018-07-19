'use strict';
const AnchorModel = require('../anchor/anchor-model');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/api/permissions/available',
    options: {
      auth: false
    },
    handler: function (request, h) {

      const permissions = [];

      //Model Permissions
      server.plugins['hapi-anchor-model'].modelsArray.forEach((model) => {

        if (!model.routes.disable) {
          for (const route in AnchorModel.routeMap) {
            if (!model.routes[route].disable) {
              const method = AnchorModel.routeMap[route].method.toUpperCase();
              const path = AnchorModel.routeMap[route].path + model.collectionName;
              const tag = model.collectionName;
              permissions.push({ method, path, tag, key: method + path });
            }
          }
        }
      });

      server.table().forEach((route) => {

        if (route.path !== '/api/{collectionName}') {
          const method = route.method.toUpperCase();
          const path = route.path;
          const tag = path.split('/')[2];
          permissions.push({ method, path, tag, key: method + path });
        }
      });

      return permissions;
    }
  });

};


module.exports = {
  name: 'api-permissions',
  dependencies: [
    'hapi-auth-cookie',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
