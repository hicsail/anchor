'use strict';
const internals = {};
const Config = require('../../../config');
const ScopeArray = require('../../helpers/getScopes');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/backups',
    config: {
      auth: {
        strategy: 'session',
        scope:  ScopeArray('/backups', 'GET', ['root', 'admin'])
      }
    },
    handler: function (request, reply) {

      return reply.view('backups/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Backups',
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
  name: 'backupList',
  dependencies: 'visionary'
};
