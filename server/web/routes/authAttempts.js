'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/authAttempts',
    options : {
      auth: {
        strategies: ['session']
      }
    },
    handler: function (request, h) {

      return h.view('authAttempts/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Auth Attempts',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });
};

module.exports = {
  name: 'authAttemptsList',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
