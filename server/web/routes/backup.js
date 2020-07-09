'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/backups',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin']
      }
    },
    handler: async function (request, h) {

      return h.view('backups/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Backups',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });  
};

module.exports = {
  name: 'backupList',
  dependencies: [    
    'auth'   
  ],
  register
};