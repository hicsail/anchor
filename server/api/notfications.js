'use strict';
const Boom = require('boom');
const Config = require('../../config');
const Hoek = require('hoek');
const Notification = require('../models/notification');
const User = require('../models/user');
const Wreck = require('wreck');

const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/notifications',
    options: {
      tags: ['api','notification'],
      description: 'Send a new notification to a user',
      auth: {
        strategies: ['simple', 'session', 'token']
      },
      validate: {
        payload: Notification.payload
      },
      pre: [{
        assign: 'user',
        method: async function (request, h) {

          const user = await User.findById(request.payload.userId);

          if (!user) {
            throw Boom.notFound('User not found');
          }

          return user;
        }
      }]
    },
    handler: async function (request, h) {

      const user = request.pre.user;

      const response = await Wreck.post('https://onesignal.com/api/v1/notifications',{
        payload: JSON.stringify({
          include_player_ids: user.playerIds || [],
          app_id: Config.get('/onesignal/appId'),
          'contents': {
            'en': request.payload.message
          },
          'headings': {
            'en': request.payload.title
          },
          'data': request.payload.data,
          'send_after': new Date(request.payload.deliveryAt).toISOString()
        }),
        headers: {
          Authorization: `Basic ${Config.get('/onesignal/apiKey')}`
        }
      });

      return response;
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/notification/playerId/{playerId}',
    options: {
      tags: ['api','notification'],
      description: 'Add player id to current user.',
      auth: {
        strategies: ['simple', 'session', 'token']
      }
    },
    handler: async function (request, h) {

      const id = request.auth.credentials.user._id;
      const user = await User.findById(id);
      const playerIds = Hoek.unique(user.playerIds.push(request.params.playerIds));

      return await User.findByIdAndUpdate(id, {
        $set: {
          playerIds
        }
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/notification/playerId/{playerId}',
    options: {
      tags: ['api','notification'],
      description: 'Remove player id to current user.',
      auth: {
        strategies: ['simple', 'session', 'token']
      }
    },
    handler: async function (request, h) {

      const id = request.auth.credentials.user._id;
      const user = await User.findById(id);
      const playerIds = user.playerIds.filter((playerId) => playerId !== request.params.playerId);

      return await User.findByIdAndUpdate(id, {
        $set: {
          playerIds
        }
      });
    }
  });

};

module.exports = {
  name: 'api-notifications',
  dependencies: [
    'auth',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
