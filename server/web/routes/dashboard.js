'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options : {
      auth: {
        strategies: ['session'],
        mode: 'try'
      }
    },
    handler: async function (request, h) {

      if (request.auth.isAuthenticated) {

        return h.view('dashboard/index', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Dashboard',
          baseUrl: Config.get('/baseUrl')
        });        
      } 
      else {
        return h.view('login/login', {
          projectName: Config.get('/projectName'),
          title: 'Login',
          baseUrl: Config.get('/baseUrl')
        });
      }      
    }
  });  
};

module.exports = {
  name: 'dashboard',
  dependencies: [
    'inert',
    'vision',
    'auth'   
  ],
  register
};