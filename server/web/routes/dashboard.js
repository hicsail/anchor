'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options : {
      auth: {
        strategies: ['session']
      }
    },
    handler: function (request, h) {

      return h.view('dashboard/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Dashboard',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });
};

module.exports = {
  name: 'dashboard',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
