'use strict';
const Config = require('../../../config');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helper/getRoleNames');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/backups',
    options: {
      auth: {
        strategies: ['session'],
        scope: PermissionConfigTable.GET['/backups'] || DefaultScopes
      }
    },
    handler: function (request, h) {

      return h.view('backups/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Backups',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });
};

module.exports = {
  name: 'backupList',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
