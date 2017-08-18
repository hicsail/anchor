'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('users/index', {user: request.auth.credentials.user});
    }
  });

  server.route({
    method: 'GET',
    path: '/roles',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      return reply.view('users/roles', {user: request.auth.credentials.user});
    }
  });

  server.route({
    method: 'GET',
    path: '/participation',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      return reply.view('users/participation', {user: request.auth.credentials.user});
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'usersList',
  dependencies: 'visionary'
};
