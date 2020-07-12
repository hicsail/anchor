'use strict';
const internals = {};
const Config = require('../../../config');
const PermissionConfigTable = require('../../../permission-config');
const DefaultRoles = require('../../helper/getDefaultRoles');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/sessions',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/sessions'] || DefaultRoles
      }
    },
    handler: function (request, reply) {

      return reply.view('sessions/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Sessions',
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
  name: 'sessionsList',
  dependencies: 'visionary'
};
