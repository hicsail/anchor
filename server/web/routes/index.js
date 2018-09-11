'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials
      };

      return h.view('index', props);
    }
  });
};

module.exports = {
  name: 'web-index',
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
