'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/clinician',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('clinician/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Clinician',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });  
};

module.exports = {
  name: 'ClinicianList',
  dependencies: [    
    'auth'   
  ],
  register
};