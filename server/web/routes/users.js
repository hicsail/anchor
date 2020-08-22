'use strict';
const internals = {};
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');
const Boom = require('boom');
const PermissionConfigTable = require('../../permission-config.json');
const DefaultScopes = require('../../helpers/getRoleNames');
const Fs = require('fs');
const IsSameScope = require('../../helpers/isSameScope');

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
          return Boom.notFound(err);
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

      const ConfigurableRoutes = { 'GET': {}, 'PUT': {}, 'DELETE': {}, 'POST': {} };
      const UnconfigurableRoutes = { 'GET': {}, 'PUT': {}, 'DELETE': {}, 'POST': {} };
      server.table()[0].table.forEach((route) => {//processing specifically each routes in server

        const path = route.path;
        const method = route.method.toUpperCase();

        if (route.settings.hasOwnProperty('auth') && typeof route.settings.auth !== 'undefined' && route.settings.auth.hasOwnProperty('access') ){
          ConfigurableRoutes[method][path] = route.settings.auth.access[0].scope.selection;

          if (!IsSameScope(ConfigurableRoutes[method][path], PermissionConfigTable[method][path])){
            console.log('adding unconfigurable route: ', method, path );
            if (!UnconfigurableRoutes.hasOwnProperty(method)){
              UnconfigurableRoutes[method] = {};
            }
            UnconfigurableRoutes[method][path] = ConfigurableRoutes[method][path];
            delete ConfigurableRoutes[method][path]; //deletes from the configurable route table.
          }
        }
        else {//routes don't have scope property defined, hence unconfigurable
          if (!UnconfigurableRoutes.hasOwnProperty(method)){
            UnconfigurableRoutes[method] = {};
          }
          UnconfigurableRoutes[method][path] = DefaultScopes;
        }
      });

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
