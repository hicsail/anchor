'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options : {
      auth: {
        strategies: ['session']                
      }
    },
    handler: async function (request, h) {     
      console.log("hereee")
      return h.view('dashboard/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Dashboard',
        baseUrl: Config.get('/baseUrl')
      });             
    }
  });  
};

module.exports = {
  name: 'dashboard',
  dependencies: [
    'inert',
    //'vision',
    'auth'   
  ],
  register
};