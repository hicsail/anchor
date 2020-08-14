'use strict';
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/users',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('users/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/roles',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, h) => {
            return h.continue; 
            /*Authorization(request, PermissionConfigTable['/roles']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));*/
          }
        }
      ]
    },
    handler: async function (request, h) {

      const users = await User.find({});

      if (!users) {        
        throw Boom.notFound('Document not found.');        
      }

      return h.view('users/roles', {
        user: request.auth.credentials.user,
        usersList: users,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl'),
        role: Config.get('/roles')
      });      
    }
  });

  /*server.route({
    method: 'GET',
    path: '/roles',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: async function (request, h) {

      return h.view('users/roles', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });*/

  server.route({
    method: 'GET',
    path: '/participation',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: async function (request, h) {

      return h.view('users/participation', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/users/create',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin','researcher']
      }
    },
    handler: async function (request, h) {

      return h.view('users/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/change-password/{id}',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      }
    },
    handler: async function (request, h) {

      return h.view('users/password', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/users/{id}',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const user = await User.findById(request.params.id);

      return h.view('users/edit', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Users',
        baseUrl: Config.get('/baseUrl'),
        editUser: user
      });      
    }
  });


  server.route({
    method: 'GET',
    path: '/users/clinicians/{id}',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      return h.view('clinician/usersClinicians', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'User\'s Clinicians',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });  
};

module.exports = {
  name: 'usersList',
  dependencies: [
    'hapi-anchor-model',
    'auth'       
  ],
  register
};