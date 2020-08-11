'use strict';
const internals = {};
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');
const Boom = require('boom');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helpers/getRoleNames');
const Fs = require('fs');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/users'] || DefaultScopes
      }
    },
    handler: function (request, reply) {

      return reply.view('users/index', {
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
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/roles'] || ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      User.find({}, (err, users) => {

        if (err) {
          Boom.notFound(err);
        }

        if (!users) {
          Boom.notFound('Document not found.');
        }

        return reply.view('users/roles', {
          user: request.auth.credentials.user,
          usersList: users,
          projectName: Config.get('/projectName'),
          title: 'Users',
          baseUrl: Config.get('/baseUrl'),
          role: DefaultScopes
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/participation',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/participation'] || ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      return reply.view('users/participation', {
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
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/users/create'] || ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      return reply.view('users/create', {
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
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/change-password/{id}'] || ['root', 'admin']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      }
    },
    handler: function (request, reply) {

      return reply.view('users/password', {
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
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/users/{id}'] || ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      User.findById(request.params.id, (err, user) => {

        if (err) {
          return reply(err);
        }

        return reply.view('users/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Users',
          baseUrl: Config.get('/baseUrl'),
          editUser: user
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/users/clinicians/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/users/clinicians/{id}'] || ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      return reply.view('clinician/usersClinicians', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'User\'s Clinicians',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/scopes',
    config: {
      auth: {
        strategy: 'session',
        scope: PermissionConfigTable.GET['/scopes'] || DefaultScopes
      }
    },
    handler: function (request, reply) {

      const ConfigurableRoutes = {};
      const UnconfigurableRoutes = {};
      let AnyUnconfigurable = false; //checks for if there is any unconfigurable routes at all, if true we update the config file
      server.table()[0].table.forEach((item) => {

        if (item.hasOwnProperty('path')){//processing specifically each routes in server
          const path = item.path;
          const method = item.method.toUpperCase();
          if (!ConfigurableRoutes.hasOwnProperty(method)){
            ConfigurableRoutes[method] = {};
          }

          if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
            ConfigurableRoutes[method][path] = item.settings.auth.access[0].scope.selection;
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
      return reply.view('users/scopes', {
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

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'usersList',
  dependencies: 'visionary'
};
