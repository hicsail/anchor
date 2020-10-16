'use strict';
const Fs = require('fs');
const Boom = require('boom');
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');
const DefaultScopes = require('../../helper/getRoleNames');
const PermissionConfigTable = require('../../permission-config.json');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/users',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: function (request, h) {

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
      pre: [{
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

  server.route({
    method: 'GET',
    path: '/scopes',
    options: {
      auth: {
        strategy: 'session',
        scope: ['root']
        //scope: ScopeArray('/scopes', 'GET', DefaultScopes)
      }
    },
    handler: function (request, h) {

      const ConfigurableRoutes = {};
      const UnconfigurableRoutes = {};
      let AnyUnconfigurable = false; //checks for if there is any unconfigurable routes at all, if true we update the config file
      server.table().forEach((route) => {

        if (route.hasOwnProperty('path')){//processing specifically each routes in server
          const path = route.path;
          const method = route.method.toUpperCase();
          if (!ConfigurableRoutes.hasOwnProperty(method)){
            ConfigurableRoutes[method] = {};
          }

          if (route.settings.hasOwnProperty('auth') && typeof route.settings.auth !== 'undefined' && route.settings.auth.hasOwnProperty('access') ){
            ConfigurableRoutes[method][path] = route.settings.auth.access[0].scope.selection;
          }
          else {//routes don't have scope, assign default value to each route
            ConfigurableRoutes[method][path] = DefaultScopes;
          }

          if (!PermissionConfigTable[method][path]){ //check to see if they exist in the config file if not add that route and its scopes to config file.
            PermissionConfigTable[method][path] = ConfigurableRoutes[method][path];
          }

          //checking for unconfigurable routes (if the route exists in config file but the scopes are different to the server)
          const set = new Set();
          ConfigurableRoutes[method][path].forEach((role) => {

            set.add(role);
          });
          AnyUnconfigurable = PermissionConfigTable[method][path].some((role) => {//if a certain route doesn't have the same scope as the one in server means its unconfigurable.

            if (!set.has(role)){
              console.log('adding unconfigurable route: ', method, path );
              if (!UnconfigurableRoutes.hasOwnProperty(method)){
                UnconfigurableRoutes[method] = {};
              }
              UnconfigurableRoutes[method][path] = ConfigurableRoutes[method][path];
              delete ConfigurableRoutes[method][path]; //deletes from the configurable route table.
              return true;
            }
          });
        }
      });

      if (AnyUnconfigurable){
        Fs.writeFileSync('server/permission-config.json', JSON.stringify(PermissionConfigTable, null, 2));
      }
      return h.view('users/scopes', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Routing & Scopes',
        baseUrl: Config.get('/baseUrl'),
        GET: ConfigurableRoutes.GET,
        PUT: ConfigurableRoutes.PUT,
        DELETE: ConfigurableRoutes.DELETE,
        POST: ConfigurableRoutes.POST,
        GETunconfig: UnconfigurableRoutes.GET,
        PUTunconfig: UnconfigurableRoutes.PUT,
        DELETEunconfig: UnconfigurableRoutes.DELETE,
        POSTunconfig: UnconfigurableRoutes.POST,
        role: DefaultScopes,
        UnconfigurableRoutes
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/participation',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, h) {

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
    handler: function (request, h) {

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
    handler: function (request, h) {

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
    handler: function (request, h) {

      return h.view('groupAdmins/usersClinicians', {
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
