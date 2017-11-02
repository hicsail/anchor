/* $lab:coverage:off$ */
'use strict';
const internals = {};
const Config = require('../../../config');
const Template = require('../../models/template');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/templates',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('templates/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/templates/create',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('templates/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/templates/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      Template.findById(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('templates/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          document
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
  name: 'templatesList',
  dependencies: 'visionary'
};
/* $lab:coverage:on$ */
