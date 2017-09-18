'use strict';
const internals = {};
const Config = require('../../../config');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/feedback',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('feedback/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
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
  name: 'feedbackList',
  dependencies: 'visionary'
};
