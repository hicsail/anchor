'use strict';
const Boom = require('boom');

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

      return h.view('login');
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
    path: '/setup',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'rootUserCheck',
        method: async function (request, h) {

          const root = await require('../../models/user').findById('000000000000000000000000');
          if (root) {
            throw Boom.notFound();
          }
        }
      }]
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }

      return h.view('setup');
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
