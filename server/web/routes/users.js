'use strict';
const internals = {};
const Config = require('../../../config');
const Joi = require('joi');
const User = require('../../models/user');
const Boom = require('boom');
const PermissionConfigTable = require('../../../permission-config');
const Authorization = require('../helpers/authorization');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategy: 'session'
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
        strategy: 'session'
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/roles']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
          role: Config.get('/role')
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/participation',
    config: {
      auth: {
        strategy: 'session'
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/participation']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
        strategy: 'session'
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/users/create']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
        strategy: 'session'
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/change-password/{id}']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
        strategy: 'session'
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/users/{id}']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
        strategy: 'session'
      },
      pre: [
        {
          assign: 'Authorization',
          method: (request, reply) => {

            Authorization(request, PermissionConfigTable['/users/clinicians/{id}']) ?
              reply(true) :
              reply(Boom.conflict('Insufficient Authorization for user: ' + request.auth.credentials.user._id));
          }
        }
      ]
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
