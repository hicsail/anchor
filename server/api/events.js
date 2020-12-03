'use strict';
const Event = require('../models/event');
const PermissionConfigTable = require('../permission-config.json');

const register = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/events/{name}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: async function (request, h) {

      let userId = null;

      if (request.auth.isAuthenticated) {
        userId = request.auth.credentials.user._id.toString();
      }

      const event = await Event.create(request.params.name, userId);

      return event;
    }
  });

  server.route({
    method: 'GET',
    path: '/api/events/name/{name}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.GET['/api/events/name/{name}'] || ['root']
      }
    },
    handler: async function (request, h) {

      const events = await Event.find({ name: request.params.name });

      return events;
    }
  });

  server.route({
    method: 'GET',
    path: '/api/events/user/{userId}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.GET['/api/events/user/{userId}'] || ['root']
      }
    },
    handler: async function (request, h) {

      const events = await Event.find({ userId: request.params.userId });

      return events;
    }
  });
};

module.exports = {
  name: 'events',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
