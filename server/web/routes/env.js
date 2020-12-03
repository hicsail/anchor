'use strict';
const Config = require('../../../config');
const Env = require('dotenv');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helper/getRoleNames');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/env',
    options: {
      auth: {
        strategies: ['session'],
        scope: PermissionConfigTable.GET['/env'] || DefaultScopes
      }
    },
    handler: function (request, h) {

      return h.view('env/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Env',
        baseUrl: Config.get('/baseUrl'),
        env: Env.config().parsed
      });
    }
  });
};

module.exports = {
  name: 'envList',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
