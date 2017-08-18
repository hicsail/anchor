'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/',
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

      let user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }
      return reply.view('index/index', {user});
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'home',
  dependencies: 'visionary'
};
