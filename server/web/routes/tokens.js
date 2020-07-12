'use strict';
const internals = {};
const Config = require('../../../config');
const Token = require('../../models/token');
const PermissionConfigTable = require('../../../permission-config');
const DefaultRoles = require('../../helper/getDefaultRoles');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/tokens',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/tokens'] || DefaultRoles
      }
    },
    handler: function (request, reply) {

      return reply.view('tokens/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Tokens',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/tokens/create',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/tokens/create'] || ['root', 'admin','researcher']
      }
    },
    handler: function (request, reply) {

      return reply.view('tokens/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Tokens',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/tokens/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/tokens/{id}'] || ['root', 'admin','researcher']
      }
    },
    handler: function (request, reply) {

      Token.findById(request.params.id, (err, token) => {

        if (err) {
          return reply(err);
        }

        return reply.view('tokens/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Tokens',
          baseUrl: Config.get('/baseUrl'),
          token
        });
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
  name: 'tokenList',
  dependencies: 'visionary'
};
