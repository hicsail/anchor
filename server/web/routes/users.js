'use strict';
const internals = {};
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');
const Boom = require('boom');
const ScopeArray = require('../../helpers/getScopes');
const DefaultScopes = require('../../helpers/getRoleNames');
const PermissionConfigTable = require('../../permission-config.json');
const GetUnconfigurableRoutes = require('../../helpers/getUnconfigurableRoutes'); //TODO: Var name to be changed to appropriate one

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/users', 'GET', DefaultScopes)
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
        scope: ScopeArray('/roles', 'GET', ['root', 'admin', 'researcher'])
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
        scope: ScopeArray('/participation', 'GET', ['root', 'admin', 'researcher'])
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
        scope: ScopeArray('/users/create', 'GET', ['root', 'admin', 'researcher'])
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
        scope: ScopeArray('/change-password/{id}', 'GET', ['root', 'admin'])
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
        scope: ScopeArray('/users/{id}', 'GET', ['root', 'admin'])
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
        scope: ScopeArray('/users/clinicians/{id}', 'GET', ['root', 'admin'])
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
        scope: ScopeArray('/scopes', 'GET', DefaultScopes)
      }
    },
    handler: function (request, reply) {

      const unConfigRoutes = GetUnconfigurableRoutes(DefaultScopes, server, PermissionConfigTable);
      const routes = PermissionConfigTable;
      for (const route of unConfigRoutes){//Shows only configurable routes on the 'routeTable' table
        delete routes[route.method][route.path];
      }
      return reply.view('users/scopes', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Routing & Scopes',
        baseUrl: Config.get('/baseUrl'),
        routes,
        role: DefaultScopes,
        UnconfigurableRoutes: unConfigRoutes
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
