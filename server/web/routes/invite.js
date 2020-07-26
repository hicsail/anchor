'use strict';
const internals = {};
const Config = require('../../../config');
const Invite = require('../../models/invite');
const ScopeArray = require('../../helpers/getScopes');
const DefaultScopes = require('../../helpers/getRoleNames');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/invite',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/invite', 'GET', DefaultScopes)
      }
    },
    handler: function (request, reply) {

      return reply.view('invite/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Invites',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/create',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/invite/create', 'GET', ['root', 'admin','clinician','researcher'])
      }
    },
    handler: function (request, reply) {

      return reply.view('invite/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Invites',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/edit/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/invite/edit/{id}', 'GET', ['root','admin'])
      }
    },
    handler: function (request, reply) {

      Invite.findById(request.params.id, (err, invite) => {

        if (err) {
          return reply(err);
        }

        return reply.view('invite/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Invites',
          baseUrl: Config.get('/baseUrl'),
          invite
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/{id}',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session',
        scope: ScopeArray('/invite/{id}', 'GET', DefaultScopes)
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      }
      Invite.findById(request.params.id, (err, invite) => {

        if (err) {
          return reply(err);
        }
        let valid = false;
        if (invite) {
          const date = new Date().getTime();
          if (invite.status === 'Pending' && date < invite.expiredAt.getTime()) {
            valid = true;
          }
        }
        return reply.view('invite/view', {
          projectName: Config.get('/projectName'),
          title: 'Invites',
          baseUrl: Config.get('/baseUrl'),
          invite,
          valid
        });
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
  name: 'inviteList',
  dependencies: 'visionary'
};
