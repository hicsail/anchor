'use strict';
const internals = {};
const Config = require('../../../config');
const PermissionConfigTable = require('../../../permission-config');
const DefaultRoles = require('../../helper/getDefaultRoles');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/clinician',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/clinician'] || DefaultRoles
      }
    },
    handler: function (request, reply) {

      return reply.view('clinician/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Clinician',
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
  name: 'ClinicianList',
  dependencies: 'visionary'
};
