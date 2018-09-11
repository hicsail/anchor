'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/login',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }

      return h.view('pages/login');
    }
  });

  server.route({
    method: 'GET',
    path: '/signup',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }

      return h.view('signup');
    }
  });

  server.route({
    method: 'GET',
    path: '/logout',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      }
    },
    handler: async function (request, h) {

      const logoutRequest = {
        method: 'DELETE',
        url: '/api/logout',
        headers: request.headers
      };

      await server.inject(logoutRequest);

      return h.redirect('/');
    }
  });
};

module.exports = {
  name: 'web-login',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
