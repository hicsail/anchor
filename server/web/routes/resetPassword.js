'use strict'
const internals = {};

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;

  server.route({
    method: 'GET',
    path: '/reset_password',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {
      return reply.view('resetPassword/resetPassword')
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
}

exports.register.attributes = {
  name: 'resetPassword',
  dependencies: 'visionary'
}
