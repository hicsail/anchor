'use strict';
const Hoek = require('hoek');
const User = require('../models/user');

const register = function (server, serverOptions) {

  server.route({
    method: 'PUT',
    path: '/api/notification/playerId/{playerId}',
    options: {
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
