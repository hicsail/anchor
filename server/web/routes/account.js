'use strict';
const internals = {};
const Config = require('../../../config');
const ScopeArray = require('../../helpers/getScopes');
// eslint-disable-next-line hapi/hapi-capitalize-modules
const defaultScopes = require('../../helpers/getRoleNames');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/account',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/account', 'GET', defaultScopes)
      }
    },
    handler: function (request, reply) {

      return reply.view('account/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Accounts',
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
  name: 'account',
  dependencies: 'visionary'
};
