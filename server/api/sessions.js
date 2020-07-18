'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Session = require('../models/session');


const register = function (server, options) {  

  server.route({
    method: 'DELETE',
    path: '/api/sessions/my/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [{
        assign: 'current',
        method: async function (request,h) {

          const currentSession = request.auth.credentials.session._id.toString();

          if (currentSession === request.params.id) {

            throw Boom.badRequest('Unable to close your current session. You can use logout instead.');
          }

          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const userId = request.auth.credentials.user._id.toString();

      const filter = {
        _id: Session.ObjectID(id),
        userId
      };

      const session = await Session.findOneAndDelete(filter);

      if (!session) {
        throw Boom.notFound('Document not found.');
      }

      return ({ message: 'Success' });      
    }
  });  
};

module.exports = {
  name: 'sessions',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};