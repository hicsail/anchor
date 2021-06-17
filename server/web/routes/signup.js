'use strict';
const Config = require('../../../config');

const register  = function (server, options) {

  server.route({
    method: 'GET',
    path: '/signup',
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
      return h.view('signup/signup',{
        projectName: Config.get('/projectName'),
        title: 'Signup',
        baseUrl: Config.get('/baseUrl'),
        usernameRequired: Config.get('/loginInfo/usernameRequired')
      });
    }
  });

};

module.exports = {
  name: 'signup/index',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
