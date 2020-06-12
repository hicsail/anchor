'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/sessions',
    options: {
      auth: {
        strategies: ['session'],
        mode: 'try'
      }
    },
    handler: async function (request, h) {

      return h.view('sessions/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Sessions',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });  
};

module.exports = {
  name: 'sessionsList',
  dependencies: [
    'inert',
    'vision',
    'auth'   
  ],
  register
};