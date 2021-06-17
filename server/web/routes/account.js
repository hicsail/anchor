'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/account',
    options : {
      auth: {
        strategies: ['session']
      }
    },
    handler: function (request, h) {

      return h.view('account/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Accounts',
        baseUrl: Config.get('/baseUrl'),
        usernameRequired: Config.get('/loginInfo/usernameRequired')
      });
    }
  });
};

module.exports = {
  name: 'account',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
