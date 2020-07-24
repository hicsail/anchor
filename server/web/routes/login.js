'use strict';
const internals = {};
const Config = require('../../../config');
const ScopeArray = require('../../helpers/getScopes');
// eslint-disable-next-line hapi/hapi-capitalize-modules
const defaultScopes = require('../../helpers/getRoleNames');

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hicsail-hapi-mongo-models'].Session;

  server.route({
    method: 'GET',
    path: '/login',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: ScopeArray('/login', 'GET', defaultScopes)
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      if (request.auth.isAuthenticated) {
        if (request.query.returnUrl) {
          return reply.redirect(request.query.returnUrl);
        }
        return reply.redirect('/');
      }
      return reply.view('login/login', {
        projectName: Config.get('/projectName'),
        title: 'Login',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/logout',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: ScopeArray('/logout', 'GET', defaultScopes)
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      const credentials = request.auth.credentials || { session: {} };
      const session = credentials.session;

      Session.findByIdAndDelete(session._id, (err, sessionDoc) => {

        if (err) {
          return reply(err);
        }

        request.cookieAuth.clear();

        return reply.redirect('/');
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/forgot',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: ScopeArray('/forgot', 'GET', defaultScopes)
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
      return reply.view('login/forgot');

    }
  });

  server.route({
    method: 'GET',
    path: '/reset',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: ScopeArray('/reset', 'GET', defaultScopes)
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
      return reply.view('login/reset');

    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'login/index',
  dependencies: 'visionary'
};
