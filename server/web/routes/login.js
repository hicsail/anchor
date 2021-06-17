'use strict';
const Config = require('../../../config');
const Session = require('../../models/session');

const register  = function (server, options) {

  server.route({
    method: 'GET',
    path: '/login',
    options: {
      auth: {
        strategies: ['session'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        /*if (request.query.returnUrl) {
          return h.redirect(request.query.returnUrl);
        }*/
        return h.redirect('/');
      }
      return h.view('login/login', {
        projectName: Config.get('/projectName'),
        title: 'Login',
        baseUrl: Config.get('/baseUrl'),
        usernameRequired: Config.get('/loginInfo/usernameRequired')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/logout',
    options: {
      auth: {
        strategies: ['simple'],
        mode: 'try'
      }
    },
    handler: async function (request, h) {

      const credentials = request.auth.credentials || { session: {} };
      const session = credentials.session;

      try {
        await Session.findByIdAndDelete(session._id);
      }
      catch (err) {
        return err;
      }
      request.cookieAuth.clear();

      return h.redirect('/');
    }
  });

  server.route({
    method: 'GET',
    path: '/forgot',
    options: {
      auth: {
        strategies: ['simple'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }
      return h.view('login/forgot');

    }
  });

  server.route({
    method: 'GET',
    path: '/reset',
    options: {
      auth: {
        strategies: ['simple'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }
      return h.view('login/reset');

    }
  });
};

module.exports = {
  name: 'login/index',
  dependencies: [
    'auth',
    'hapi-anchor-model'
  ],
  register
};
