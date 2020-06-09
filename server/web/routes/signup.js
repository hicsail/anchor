'use strict';
const internals = {};
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
    handler: async function (request, h) {

      if (request.auth.isAuthenticated) {
        return h.redirect('/');
      }
      return h.view('signup/signup',{
        projectName: Config.get('/projectName'),
        title: 'Signup',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });
  
};

module.exports = {
  name: 'signup/index',
  /*dependencies: [
    //'visionary'
    /*'vision',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],*/
  register
};
