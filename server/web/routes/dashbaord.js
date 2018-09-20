'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options: {
      auth: {
        strategies: ['simple','session','token']
      }
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar
      };

      return h.view('dashboard', props);
    }
  });
};

module.exports = {
  name: 'web-dashboard',
  dependencies: [
    'vision',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
