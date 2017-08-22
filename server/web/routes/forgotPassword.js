'use strict'
const internals = {};

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;

  server.route({
    method: 'GET',
    path: '/forgot_password',
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

      return reply.view('forgotPassword/forgotPassword');
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'forgotPassword',
  dependencies: 'visionary'
};
