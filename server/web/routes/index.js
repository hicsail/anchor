'use strict';
const internals = {};
const Config = require('../../../config');
const path = require('path');

const register = function (server, options) { 

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: {
        strategies: ['simple'],
        mode: 'try'
      }
    },    
    handler: async function (request, h) {

      let user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }      
      return h.view('index/index', {
        user,
        projectName: Config.get('/projectName'),
        title: 'Home',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });  
};

module.exports = {
  name: 'home',
  dependencies: [
    'inert',
    'vision',
    //'visionary'
    /*'vision',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'*/
  ],
  register
};
