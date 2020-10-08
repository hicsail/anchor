'use strict';
const Config = require('../../../config');
const User = require('../../models/user');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/group-admins',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      const query = {};

      var field = "roles." + "clinician";
      query[field] = { $exists: true };

      const results  = await User.find(query);

      let result = [];
      for (let role of Config.get('/roles')) {
        if (role['type'] === 'groupAdmin') {
          
          const data = {};
          const query = {};
          data['role'] = role['name'];
          
          var field = "roles." + role['name'];
          query[field] = { $exists: true };

          const admins = await User.find(query);

          for (let admin of admins) {
            admin.userAccess = admin.roles[role['name']]['userAccess'];
          }          
          data['admins'] = admins;          
          result.push(data);
        }
      }
      
      return h.view('groupAdmins/index', {
        clinicians: results,
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'groupAmins',
        baseUrl: Config.get('/baseUrl'),
        data: result
      });
    }
  });  
};

module.exports = {
  name: 'groupAdminList',
  dependencies: [
    'hapi-anchor-model',    
    'auth'   
  ],
  register
};