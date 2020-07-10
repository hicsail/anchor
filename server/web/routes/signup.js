'use strict';
const internals = {};
const Config = require('../../../config');
const PermissionConfigTable = require('../../../permission-config');
const DEFAULT_ROLES = require('../../helper/getDefaultRoles');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/signup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: PermissionConfigTable.GET['/signup'] || DEFAULT_ROLES
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      }
      return reply.view('signup/signup',{
        projectName: Config.get('/projectName'),
        title: 'Signup',
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
  name: 'signup/index',
  dependencies: 'visionary'
};
