'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/permissions',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'permissions',
        method: async function (request,h) {

          const permissionRequest = {
            method: 'GET',
            url: '/api/permissions/available'
          };

          return (await server.inject(permissionRequest)).result;
        }
      }]
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        permissions: request.pre.permissions
      };

      return h.view('permissions', props);
    }
  });
};

module.exports = {
  name: 'web-permissions',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
