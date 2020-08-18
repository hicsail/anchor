'use strict';
const internals = {};
const Config = require('../../../config');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helpers/getRoleNames');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/authAttempts',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/authAttempts'] || DefaultScopes
      }
    },
    handler: function (request, reply) {

      return reply.view('authAttempts/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Auth Attempts',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'authAttemptsList',
  dependencies: 'visionary'
};
