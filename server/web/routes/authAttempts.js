'use strict';
const internals = {};
const Config = require('../../../config');
const PermissionConfigTable = require('../../../permission-config');
const DEFAULT_ROLES = require('../../helper/getDefaultRoles');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/authAttempts',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/authAttempts'] || DEFAULT_ROLES
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
