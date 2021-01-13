'use strict';
const Config = require('../../../config');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helper/getRoleNames');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options : {
      auth: {
        strategies: ['session'],
        scope: PermissionConfigTable.GET['/dashboard'] || DefaultScopes
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
