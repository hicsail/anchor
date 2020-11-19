'use strict';
const Config = require('../../../config');
const Invite = require('../../models/invite');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/invite',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: function (request, h) {

      return h.view('invite/index', {
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
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin','clinician','researcher']
      }
    },
    handler: function (request, h) {

      return h.view('invite/create', {
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
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const invite = await Invite.findById(request.params.id);

      return h.view('invite/edit', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Invites',
        baseUrl: Config.get('/baseUrl'),
        invite
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/{id}',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      const invite = await Invite.findById(request.params.id);

      let valid = false;
      if (invite) {
        const date = new Date().getTime();
        if (invite.status === 'Pending' && date < invite.expiredAt.getTime()) {
          valid = true;
        }
      }

      return h.view('invite/view', {
        projectName: Config.get('/projectName'),
        title: 'Invites',
        baseUrl: Config.get('/baseUrl'),
        invite,
        valid
      });
    }
  });
};

module.exports = {
  name: 'inviteList',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
