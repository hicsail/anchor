'use strict';
const internals = {};
const Env = require('dotenv');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/env',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      return reply.view('env/index', {
        user: request.auth.credentials.user,
        env: Env.config().parsed
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
  name: 'envList',
  dependencies: 'visionary'
};
